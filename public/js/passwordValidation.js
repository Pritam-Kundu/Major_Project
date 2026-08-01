const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const strengthBar = document.getElementById("passwordStrength");
const togglePassword = document.getElementById("togglePassword");

const length = document.getElementById("length");
const upper = document.getElementById("upper");
const lower = document.getElementById("lower");
const number = document.getElementById("number");
const special = document.getElementById("special");


if (password && confirmPassword && strengthBar) {

    password.addEventListener("input", () => {

        const value = password.value;

        const hasLength = value.length >= 8;
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);

        length.className = hasLength ? "text-success" : "text-danger";
        upper.className = hasUpper ? "text-success" : "text-danger";
        lower.className = hasLower ? "text-success" : "text-danger";
        number.className = hasNumber ? "text-success" : "text-danger";
        special.className = hasSpecial ? "text-success" : "text-danger";

        let score = 0;

        if (hasLength) score++;
        if (hasUpper) score++;
        if (hasLower) score++;
        if (hasNumber) score++;
        if (hasSpecial) score++;

        const percentage = score * 20;

        strengthBar.style.width = percentage + "%";

        strengthBar.classList.remove(
            "bg-danger",
            "bg-warning",
            "bg-success"
        );

        if (score <= 2) {

            strengthBar.classList.add("bg-danger");
            strengthBar.innerText = "Weak";

        }
        else if (score <= 4) {

            strengthBar.classList.add("bg-warning");
            strengthBar.innerText = "Medium";

        }
        else {

            strengthBar.classList.add("bg-success");
            strengthBar.innerText = "Strong";

        }

        if (password.value !== confirmPassword.value) {

            confirmPassword.setCustomValidity("Passwords do not match");

        } else {

            confirmPassword.setCustomValidity("");

        }

    });

    confirmPassword.addEventListener("input", () => {

        const confirmFeedback = confirmPassword.parentElement.nextElementSibling;

        if (confirmPassword.value === "") {

            confirmPassword.classList.remove("is-valid");
            confirmPassword.classList.remove("is-invalid");

            confirmFeedback.style.display = "none";

            return;
        }

        if (password.value !== confirmPassword.value) {

            confirmPassword.classList.add("is-invalid");
            confirmPassword.classList.remove("is-valid");

            confirmPassword.setCustomValidity("Passwords do not match");

            confirmFeedback.innerText = "Passwords do not match";
            confirmFeedback.style.display = "block";

        }
        if (confirmPassword.value !== "") {

            if (password.value !== confirmPassword.value) {

                confirmPassword.classList.add("is-invalid");
                confirmPassword.classList.remove("is-valid");

                confirmPassword.setCustomValidity("Passwords do not match");

                confirmFeedback.innerText = "Passwords do not match";
                confirmFeedback.style.display = "block";

            } else {

                confirmPassword.classList.remove("is-invalid");
                confirmPassword.classList.add("is-valid");

                confirmPassword.setCustomValidity("");

                confirmFeedback.style.display = "none";

            }

        } else {

            confirmPassword.classList.remove("is-invalid");
            confirmPassword.classList.add("is-valid");

            confirmPassword.setCustomValidity("");

            confirmFeedback.style.display = "none";

        }



    });

}

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const type =
            password.type === "password"
                ? "text"
                : "password";

        password.type = type;

        togglePassword.classList.toggle("fa-eye");

        togglePassword.classList.toggle("fa-eye-slash");

    });

}

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");

if (toggleConfirmPassword) {

    toggleConfirmPassword.addEventListener("click", () => {

        const type =
            confirmPassword.type === "password"
                ? "text"
                : "password";

        confirmPassword.type = type;

        toggleConfirmPassword.classList.toggle("fa-eye");

        toggleConfirmPassword.classList.toggle("fa-eye-slash");

    });

}