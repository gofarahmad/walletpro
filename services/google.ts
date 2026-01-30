import { gapi } from 'gapi-script';

// REPLACE WITH YOUR ACTUAL CLIENT ID
const CLIENT_ID = '823884161417-uqf0h8cfv5naho36v1v37a204dchcfd9.apps.googleusercontent.com';
const API_KEY = ''; // Optional if using OAuth only usually
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

const FILE_NAME = 'wealthwise_backup.json';

export const GoogleDriveService = {

    async initClient() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    clientId: CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES,
                }).then(() => {
                    resolve(gapi.auth2.getAuthInstance().isSignedIn.get());
                }).catch((err: any) => {
                    console.error("Error initializing Google API", err);
                    reject(err);
                });
            });
        });
    },

    async signIn() {
        const auth = gapi.auth2.getAuthInstance();
        const user = await auth.signIn();
        return user.getBasicProfile().getEmail();
    },

    async signOut() {
        const auth = gapi.auth2.getAuthInstance();
        await auth.signOut();
    },

    isSignedIn() {
        const auth = gapi.auth2.getAuthInstance();
        return auth ? auth.isSignedIn.get() : false;
    },

    getCurrentUserEmail() {
        const auth = gapi.auth2.getAuthInstance();
        if (auth && auth.isSignedIn.get()) {
            return auth.currentUser.get().getBasicProfile().getEmail();
        }
        return null;
    },

    async findFile() {
        try {
            const response = await gapi.client.drive.files.list({
                spaces: 'appDataFolder',
                q: `name = '${FILE_NAME}' and trashed = false`,
                fields: 'files(id, name)',
            });
            const files = response.result.files;
            if (files && files.length > 0) {
                return files[0].id;
            }
            return null;
        } catch (err) {
            console.error("Error searching file", err);
            return null;
        }
    },

    async uploadData(data: any) {
        const fileContent = JSON.stringify(data);
        const fileId = await this.findFile();

        const file = new Blob([fileContent], { type: 'application/json' });
        const metadata = {
            name: FILE_NAME,
            mimeType: 'application/json',
            parents: ['appDataFolder'], // Save to hidden AppData folder
        };

        const accessToken = gapi.auth.getToken().access_token;
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (fileId) {
            // Update existing file
            url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
            method = 'PATCH';
        }

        try {
            await fetch(url, {
                method: method,
                headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                body: form,
            });
            console.log('Upload successful');
        } catch (err) {
            console.error('Upload failed', err);
            throw err;
        }
    },

    async downloadData() {
        const fileId = await this.findFile();
        if (!fileId) return null;

        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media',
            });
            return response.result; // This should be the JSON object
        } catch (err) {
            console.error("Error downloading file", err);
            return null;
        }
    }
};
