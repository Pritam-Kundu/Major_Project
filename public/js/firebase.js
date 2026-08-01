import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {

    apiKey: "AIzaSyDj7PPv9LKASPqprfd5YrML2JALTIpWsYY",

    authDomain: "homigo-662ea.firebaseapp.com",

    projectId: "homigo-662ea",

    storageBucket: "homigo-662ea.firebasestorage.app",

    messagingSenderId: "759945154649",

    appId: "1:759945154649:web:10f631c737a03442956148"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

window.auth = auth;

window.provider = provider;

window.signInWithPopup = signInWithPopup;