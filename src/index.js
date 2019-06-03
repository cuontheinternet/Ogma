/* global io, $ */
/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import Promise from 'bluebird';
import ReactDOM from 'react-dom';
import {EventEmitter2} from 'eventemitter2';
import 'react-notifications/lib/notifications.css';
import 'bulma-extensions/dist/css/bulma-extensions.min.css';
import {NotificationContainer, NotificationManager} from 'react-notifications';

import './scss/index.scss';
import App from './react/App';
import DataManager from './util/DataManager';
import IpcModule from '../../shared/IpcModule';
import * as serviceWorker from './util/serviceWorker';
import ErrorHandler, {UserFriendlyError} from './util/ErrorHandler';

// Setup base URL
window.serverHost = 'http://localhost:10548';

// Setup error handling functions
window.handleError = ErrorHandler.handleMiscError;
window.handleErrorQuiet = ErrorHandler.handleMiscErrorQuiet;

// Initialize notification component (only need to do this once)
ReactDOM.render(<NotificationContainer/>, document.getElementById('notif'));

// Socket.IO connection logic
const socketInitPromise = new Promise(resolve => {
    const socket = io.connect(window.serverHost);

    let firstConnection = true;
    socket.on('connect', () => {
        NotificationManager.success('Successfully connected to Ogma server.');

        if (firstConnection) {
            firstConnection = false;
            resolve(socket);
        }
    });
    socket.on('disconnect', () => {
        NotificationManager.warning('Lost connection to server!');
    });
    socket.on('connect_error', error => {
        NotificationManager.error('Error occurred when connecting to server.');
        console.error(error);
    });
});

// Prepare loader reference
const appLoaderDiv = $('#app-loader');

// Initialize the rest of the app if socket connection succeeded
socketInitPromise
    .then(socket => new Promise((resolve, reject) => {

        // Setup the event emitter
        window.proxyEmitter = new EventEmitter2({wildcard: true, newListener: false, maxListeners: 20});

        // Setup logic for forwarded event
        const eventHandler = eventData => window.proxyEmitter.emit(eventData.name, ...eventData.args);
        const errorHandler = errorMessage => new UserFriendlyError({
            title: 'Server-side error',
            message: `Server has encountered an error: "${errorMessage}"`,
        });
        window.ipcModule = new IpcModule({socket, eventHandler, errorHandler});
        window.ipcModule.getConnectionDetails()
            .then(connDetails => resolve({socket, connDetails}))
            .catch(reject);
    }))
    .then(result => {
        const {socket, connDetails} = result;
        window.dataManager = new DataManager({socket, connDetails});
        return window.dataManager.init();
    })
    .then(() => {
        appLoaderDiv.hide();
        ReactDOM.render(<App/>, document.getElementById('root'));
    })
    .catch(error => {
        console.error(error);
        const errorDiv = $('#app-loader-message');
        errorDiv.addClass('error');
        errorDiv.html(`Startup error: &nbsp;<strong>${error.message}</strong>`);
    });

// Do nothing with server workers since we don't support them yet
serviceWorker.unregister();