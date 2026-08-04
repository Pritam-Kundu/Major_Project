const Support = require("../models/support.js");
const Booking = require("../models/booking.js");

module.exports.index = (req, res) => {

    res.render("help/index");

};

module.exports.contactForm = async (req, res) => {

    const bookings = await Booking.find({

        user: req.user._id

    })

        .populate("listing")

        .sort({

            createdAt: -1

        });

    res.render("help/contact", {

        bookings

    });

};

module.exports.createTicket = async (req, res) => {

    const ticket = new Support({

        subject: req.body.subject,

        message: req.body.message,

        category: req.body.category,

        booking: req.body.booking || null,

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

        .populate({

            path: "booking",

            populate: {

                path: "listing"

            }

        })

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