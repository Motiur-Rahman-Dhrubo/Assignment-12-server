const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrrul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();





    const apartmentCollection = client.db("mTowerDB").collection("apartments");
    const requestCollection = client.db("mTowerDB").collection("requests");
    const userCollection = client.db("mTowerDB").collection("users");

    app.get("/apartments", async(req, res) => {
      const result = await apartmentCollection.find().toArray();
      res.send(result);
    });

    app.get("/requests", async (req, res) => {
      const email = req.query.email;
      const query = { reqUserEmail: email };
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/all-users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/members", async (req, res) => {
      const query = { userRole: "member" };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/requests", async (req, res) => {
      const requestedFlat = req.body;
      const result = await requestCollection.insertOne(requestedFlat);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { userEmail: user.userEmail };
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exists'})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('server is working')
});

app.listen(port, () => {
    console.log(`server is working on port ${port}`)
})