const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


app.use(cors({
    origin:['http://localhost:5173'],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser())

const verifyToken =async(req,res,next)=>{
const token =req.cookies?.token;
console.log('fshsfg', token);
if(!token){
    return res.status(401).send({message: 'not authorized'})
}

    next()
}


const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.PASS_KEY}@cluster0.tgeue7q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        const ecoFoodCollection = client.db('ecoFooddb').collection('ecoFooddb');
        const ecoFoodCollectionRequest = client.db('ecoFooddb').collection('ecoFoodrequest');

        // auth related api 
        app.post('/jwt', async (req, res) => {

            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1d" })
            res
            .cookie('token', token, {
                httpOnly:true,
                secure:false,
                sameSite:'none'
            })
            .send({success:true})
        })



        // server related api
        app.get('/food', async (req, res) => {
            console.log('token',req.cookies);
            const sort = req.query.sort
            let options = {}
            if (sort) options = { sort: { expiredDateTime: sort === 'asc' ? 1 : -1 } }

            const cursor = ecoFoodCollection.find(options);

            const result = await cursor.toArray();
            res.send(result);
        })


        app.post('/food', async (req, res) => {
            const addedFood = req.body;
            console.log(addedFood);
            const result = await ecoFoodCollection.insertOne(addedFood);
            res.send(result);
        })



        app.get('/food/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await ecoFoodCollection.findOne(query);
            res.send(result);
        })


        app.get('/ManageMyFoods/:email', async (req, res) => {
            console.log(req.params.email);
            
            const result = await ecoFoodCollection.find({ email: req.params.email }).toArray();
            res.send(result)
        })



        app.delete('/food/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await ecoFoodCollection.deleteOne(query);
            res.send(result);
        })

        app.put('/food/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedFood = req.body;
            const foodItems = {
                $set: {
                    imageUrl: updatedFood.imageUrl,
                    foodName: updatedFood.foodName,
                    foodQuantity: updatedFood.foodQuantity,
                    pickupLocation: updatedFood.pickupLocation,
                    expiredDateTime: updatedFood.expiredDateTime,
                    additionalNotes: updatedFood.additionalNotes,

                }
            }
            const result = await ecoFoodCollection.updateOne(filter, foodItems, options);
            res.send(result);
        })


        // food request section
        app.post('/foodrequest', async (req, res) => {
            const requestedFood = req.body;
            console.log(requestedFood);
            const result = await ecoFoodCollectionRequest.insertOne(requestedFood);
            res.send(result);
        })

        app.get('/foodrequest', async (req, res) => {
            const cursor = ecoFoodCollectionRequest.find();
            const result = await cursor.toArray();
            res.send(result);
        })






        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})