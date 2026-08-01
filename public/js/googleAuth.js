const googleButton = document.getElementById("googleLogin");

if (googleButton) {

    googleButton.addEventListener("click", async () => {

        try {

            const result = await signInWithPopup(auth, provider);

            const user = result.user;

            const idToken = await user.getIdToken();

            const response = await fetch("/auth/firebase", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    idToken,

                    uid: user.uid,

                    username: user.displayName,

                    email: user.email,

                    photo: user.photoURL

                })

            });

            const data = await response.json();

            if (data.success) {

                window.location.replace("/listings");

            } else {

                alert(data.message);

            }

        }

        catch (err) {

            console.error(err);

            alert(err.message);

        }

    });

}

