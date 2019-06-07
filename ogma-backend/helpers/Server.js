/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

const cors = require('cors');
const http = require('http');
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const IpcModule = require('../../shared/IpcModule');

const Util = require('./Util');

const logger = Util.getLogger();

class Server {

    /**
     * @param {object} data
     * @param {number} data.port
     * @param {OgmaCore} data.ogmaCore
     */
    constructor(data) {
        this.port = data.port;

        this.ogmaCore = data.ogmaCore;
        this.envManager = data.ogmaCore.envManager;
    }

    init() {
        this.expressApp = express();
        if (Util.isDevelopment()) this.expressApp.use(cors());

        this.httpServer = http.Server(this.expressApp);
        this.socketIO = socketIO(this.httpServer);

        // noinspection JSUnusedGlobalSymbols
        this.ipcModule = new IpcModule({socket: this.socketIO, logger, ogmaCore: this.ogmaCore});

        this.expressApp.get('/static/env/:slug/thumbs/*', (req, res) => {
            const slug = req.params.slug;
            const filePath = req.params[0];

            const env = this.envManager.getEnvironment({slug});
            if (!env) {
                res.status(404);
                return res.send(`Environment with slug "${slug}" does not exist.`);
            }

            if (!filePath) {
                res.status(400);
                return res.send('You need to specify a file.');
            }

            res.sendFile(filePath, {root: env.getThumbsDir()});
        });
        this.expressApp.use('/', express.static(Util.getStaticPath()));
        this.expressApp.use('*', express.static(path.join(Util.getStaticPath(), 'index.html')));
    }

    start() {
        return new Promise(resolve => {
            this.httpServer.listen(this.port, () => {
                logger.info(`Server listening on port ${this.port}!`);
                resolve();
            });
        });
    }

}

module.exports = Server;