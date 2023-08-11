import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import App from "./app.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AppManager {
    constructor() {
        this.apps = {}; // To store instances of each third-party app.
        this.appClasses = {}; // To store the imported classes.
    }

    async initialize() {
        const files = fs.readdirSync(__dirname);
        for (let file of files) {
            if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'app.js') {
                const name = file.replace('.js', '');
                const modulePath = new URL(`file://${path.resolve(__dirname, file)}`).href;
                const module = await import(modulePath);
                this.appClasses[name] = module.default;
            }
        }
    }    

    getApp(appInfo) {
        if (!this.apps[appInfo.id]) {
            console.log(this.appClasses)
            console.log(appInfo.systemName)
            const AppClass = this.appClasses[appInfo.systemName];
            if (AppClass) {
                this.apps[appInfo.id] = new AppClass(appInfo);
            } else {
                // If there's no specialized class for the app, default to the base App class
                this.apps[appInfo.id] = new App(appInfo);
            }
        }
        return this.apps[appInfo.id];
    }
}

const appManager = new AppManager();

// Initialize the app manager asynchronously right after creation
appManager.initialize();

export default appManager;
