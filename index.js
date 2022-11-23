const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middle ware
app.use(cors())
app.use(express.json())




//const uri = "mongodb+srv://<username>:<password>@cluster0.r2o8evu.mongodb.net/?retryWrites=true&w=majority";
const uri = "mongodb://localhost:27017";
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionCollection = client.db('doctorsPortal').collection('appointmentOptions');
        const bookingCollection = client.db('doctorsPortal').collection('bookings');


        //Use Aggregate to query multiple collection and then merge data


        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            //console.log(date);
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();

            //get the bookings of the provided date
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();

            //fiter the booked date
            options.forEach(option => {
                //console.log(option);
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = remainingSlots;
                //console.log(option.name, bookedSlots, remainingSlots.length);
            })
            res.send(options);
        });

        /*
        Api Naming Convention
        *booking
        *app.get('/bookings)
        *app.get('/bookings/:id)
        *app.post('/bookings)
        *app.patch('/bookings/:id)
        *app.delete('/bookings/:id)
        */

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate
            }


            const alreadyBooked = await bookingCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const massage = `You already have a booking ${booking.appointmentDate}`;
                return res.send({ acknowledged: false, massage })
            }

            console.log(query);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

    } finally {

    }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('doctors portal server is running!')
})

app.listen(port, () => console.log(`Doctors portal running on ${port}`))

//mongodb://localhost:27017