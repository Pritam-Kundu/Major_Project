module.exports.renderPage = (req, res) => {

    const pages = {

        about: {
            title: "About Homigo",
            description: "Homigo is your trusted platform for discovering premium hotels, unique stays, villas, resorts and unforgettable travel experiences across the world."
        },

        careers: {
            title: "Careers",
            description: "Join the Homigo team and help build the future of travel technology. We are always looking for talented developers, designers and innovators."
        },

        press: {
            title: "Press & Media",
            description: "Latest company news, press releases, media resources and brand assets."
        },

        blog: {
            title: "Travel Blog",
            description: "Explore travel guides, destination tips, hotel recommendations and inspiring stories from around the world."
        },

        giftCards: {
            title: "Gift Cards",
            description: "Gift unforgettable travel experiences to your friends and family with Homigo Gift Cards."
        },

        safety: {
            title: "Safety Information",
            description: "Learn how Homigo protects guests, hosts and payments with industry-standard security."
        },

        cancellation: {
            title: "Cancellation Policy",
            description: "Understand cancellation rules, refund policies and booking modifications."
        },

        accessibility: {
            title: "Accessibility",
            description: "Homigo is committed to providing an accessible experience for every traveler."
        },

        covid: {
            title: "COVID-19 Response",
            description: "Health guidelines, sanitization standards and travel advisories."
        },

        terms: {
            title: "Terms of Service",
            description: "Read Homigo's Terms and Conditions governing the use of our platform."
        },

        privacy: {
            title: "Privacy Policy",
            description: "Learn how Homigo collects, stores and protects your personal information."
        },

        cookies: {
            title: "Cookie Policy",
            description: "Information about cookies and tracking technologies used by Homigo."
        },

        vendor: {
            title: "Vendor Terms",
            description: "Terms and conditions for property owners and vendors using Homigo."
        }

    };

    const requestedPage = req.params.page;

    if (requestedPage === "about") {
        return res.render("pages/about");
    }

    if (requestedPage === "careers") {
        return res.render("pages/careers");
    }

    if (requestedPage === "blog") {
        return res.render("pages/blog");
    }

    if (requestedPage === "cancellation") {
        return res.render("pages/cancellation");
    }

    if (requestedPage === "cookies") {
        return res.render("pages/cookies");
    }

    if (requestedPage === "covid") {
        return res.render("pages/covid");
    }

    if (requestedPage === "giftCards") {
        return res.render("pages/giftCards");
    }

    if (requestedPage === "press") {
        return res.render("pages/press");
    }

    if (requestedPage === "privacy") {
        return res.render("pages/privacy");
    }

    if (requestedPage === "safety") {
        return res.render("pages/safety");
    }

    if (requestedPage === "terms") {
        return res.render("pages/terms");
    }

    if (requestedPage === "vendor") {
        return res.render("pages/vendorTerms");
    }

    if (requestedPage === "accessibility") {
        return res.render("pages/accessibility");
    }

    const page = pages[requestedPage];

    if (!page) {
        req.flash("error", "Page not found.");
        return res.redirect("/listings");
    }

    return res.render("pages/info", { page });
}

