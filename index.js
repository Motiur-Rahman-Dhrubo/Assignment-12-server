const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
    const announcementCollection = client.db("mTowerDB").collection("announcements");
    const couponCollection = client.db("mTowerDB").collection("coupons");

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res.send({ token });
    })

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    }

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.userRole === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    }

    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user) {
        admin = user?.userRole === 'admin';
      }
      res.send({ admin })
    })


    app.get("/user/member/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { userEmail: email };
      const user = await userCollection.findOne(query);
      let member = false;
      if (user) {
        member = user?.userRole === "member";
      }
      res.send({ member });
    });
    

    app.get("/apartments", async(req, res) => {
      const result = await apartmentCollection.find().toArray();
      res.send(result);
    });

    app.get("/requests", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { reqUserEmail: email };
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/pending-requests", verifyToken, verifyAdmin, async (req, res) => {
      const query = { reqStatus: "pending" };
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/all-users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/members", verifyToken, verifyAdmin, async (req, res) => {
      const query = { userRole: "member" };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/announcements", verifyToken, async (req, res) => {
      const result = await announcementCollection.find().toArray();
      res.send(result);
    });

    app.get("/available-coupon", async (req, res) => {
      const query = { availability: "available" };
      const result = await couponCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/all-coupon", verifyToken, verifyAdmin, async (req, res) => {
      const result = await couponCollection.find().toArray();
      res.send(result);
    });





    app.post("/requests", verifyToken, async (req, res) => {
      const requestedFlat = req.body;
      const result = await requestCollection.insertOne(requestedFlat);
      res.send(result);
    });

    app.post("/add-coupon", verifyToken, verifyAdmin, async (req, res) => {
      const addedCoupon = req.body;
      const result = await couponCollection.insertOne(addedCoupon);
      res.send(result);
    });

    app.post("/announcements", verifyToken, verifyAdmin, async (req, res) => {
      const announcement = req.body;
      const result = await announcementCollection.insertOne(announcement);
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







    // app.put("/coupon/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const updateCoupon = req.body;
    //   const action = {
    //     $set: {
    //       availability: updateCoupon.action,
    //     },
    //   };
    //   const result = await couponCollection.updateOne(filter, action);
    //   res.send(result);
    // });





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