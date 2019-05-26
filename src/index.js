/* global io */
/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import Promise from 'bluebird';
import ReactDOM from 'react-dom';
import 'react-notifications/lib/notifications.css';
import {NotificationContainer, NotificationManager} from 'react-notifications';

import './index.scss';
import App from './react/App';
import DataManager from './util/DataManager';
import * as serviceWorker from './util/serviceWorker';

// Initialize notification component (only need to do this once)
ReactDOM.render(<NotificationContainer/>, document.getElementById('notif'));

// Socket.IO connection logic
const socketInitPromise = new Promise(resolve => {
    const socket = io.connect('http://localhost:10548');

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

// Initialize the rest of the app if socket connection succeeded
socketInitPromise
    .then(socket => {
        const timeout = setTimeout(() => {
            // TODO: Add a better error message, preferably render a react component.
            console.error('Whoops!');
        }, 2000);
        socket.emit('hello', serverResponse => {
            clearTimeout(timeout);
            window.dataManager = new DataManager({socket, serverResponse});
            ReactDOM.render(<App/>, document.getElementById('root'));
        });
    });

// Do nothing with server workers since we don't support them yet
serviceWorker.unregister();
