const Support = require("../models/support");

module.exports.index = (req, res) => {

    res.render("help/index");

};

module.exports.contactForm = (req, res) => {

    res.render("help/contact");

};

module.exports.createTicket = async (req, res) => {

    const ticket = new Support({

        ...req.body,

        user: req.user._id,

        name: req.user.username,

        email: req.user.email

    });

    await ticket.save();

    req.flash(
        "success",
        "Support ticket submitted successfully."
    );

    res.redirect("/help/my-tickets");

};

module.exports.myTickets = async (req, res) => {

    const tickets = await Support.find({

        user: req.user._id

    }).sort({

        createdAt: -1

    });

    res.render("help/myTickets", {

        tickets

    });

};

module.exports.adminTickets = async (req, res) => {

    const tickets = await Support.find()

        .populate("user")

        .sort({

            createdAt: -1

        });

    res.render("help/admin", {

        tickets

    });

};


module.exports.updateTicket = async (req, res) => {

    await Support.findByIdAndUpdate(

        req.params.id,

        {

            status: req.body.status

        }

    );

    req.flash(

        "success",

        "Ticket updated successfully."

    );

    res.redirect("/help/admin");

};