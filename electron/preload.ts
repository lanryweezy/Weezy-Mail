import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  startGoogleAuth: () => ipcRenderer.send('start-google-auth'),
  onGoogleAuthCode: (callback: (event: any, code: string) => void) => {
    const listener = (event: any, code: string) => callback(event, code);
    ipcRenderer.on('google-auth-code', listener);
    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('google-auth-code', listener);
    };
  },
});
