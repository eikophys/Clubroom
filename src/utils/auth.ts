import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { app, isEmulator, logEvent } from './firebase';

let isConnectedToEmulator = false;

export const auth = (): Auth => {
  const auth = getAuth(app);
  // Connect emulator to auth
  // https://firebase.google.com/docs/emulator-suite/connect_auth
  if (isEmulator() && !isConnectedToEmulator) {
    connectAuthEmulator(auth, 'http://0.0.0.0:9099');
    isConnectedToEmulator = true;
  }
  logEvent('login');
  return auth;
};
