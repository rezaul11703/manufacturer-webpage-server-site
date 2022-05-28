const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
app.use(cors());
app.use(express.json());
// User Information
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3fzso.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
//use JS TOKEN
function verifyjwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECURITY, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    client.connect();
    const addingItems = client.db("manageItems").collection("Items"); // add items in database from admin/add items page
    const customerItems = client.db("manageItems").collection("userItems"); // add items in database from admin/add items page
    const usersReview = client.db("manageItems").collection("reviews"); // add items in database from admin/add items page
    const usersProfile = client.db("manageItems").collection("profile"); // add items in database from admin/add items page
    const usersCollection = client.db("manageItems").collection("user");
    app.post("/addedItems", async (req, res) => {
      const newItem = req.body;
      const result = await addingItems.insertOne(newItem);
      res.send(result);
    });

    app.get("/addItems", async (req, res) => {
      const query = {};
      const result = await addingItems.find(query).toArray();
      res.send(result);
    });

    /// for Purchase Section
    app.get("/purchase/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await addingItems.findOne(query);
      res.send(result);
    });
    /// for User Cart Section
    app.post("/userCart", async (req, res) => {
      const orderdItem = req.body;
      const newCart = await customerItems.insertOne(orderdItem);
      res.send(newCart);
    });
    app.get("/usersCart", async (req, res) => {
      const query = {};
      const newItems = await customerItems.find(query).toArray();
      res.send(newItems);
    });
    app.get("/userCart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const userCart = await customerItems.find(query).toArray();
      res.send(userCart);
    });

    //// User Reviews
    app.post("/userReviews", async (req, res) => {
      const reviews = req.body;
      const newreviews = await usersReview.insertOne(reviews);
      res.send(newreviews);
    });
    app.get("", async (req, res) => {
      const query = {};
      const result = await usersReview.find(query).toArray();
      res.send(result);
    });
    // User Profile
    app.put("/userProfile", async (req, res) => {
      const userProfile = req.body;
      const filter = { email: userProfile.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: userProfile.name,
          email: userProfile.email,
          address: userProfile.address,
          education: userProfile.education,
          number: userProfile.number,
          link: userProfile.link,
        },
      };
      const result = await usersProfile.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    app.get("/userProfile", async (req, res) => {
      const query = {};
      const result = await usersProfile.find(query).toArray();
      res.send(result);
    });

    /// Make Admin Sector
    app.put("/user/admin/:email", verifyjwt, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } else {
        res.status(403).send({ message: "Forbidden" });
      }
    });
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECURIY,
        { expiresIn: "3h" }
      );
      res.send({ result, token });
    });
    app.get("/allusers", async (req, res) => {
      const query = {};
      const allUsers = await usersCollection.find(query).toArray();
      res.send(allUsers);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("We are in the Computer Manufacturer Server Site on ", port);
});
app.get("/", (req, res) => {
  res.send("Welcome to the Computer Manufacturer Site");
});
