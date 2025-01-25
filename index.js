const express = require('express')
const app = express()
const cors = require ('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_ACCESS_KEY )

const { MongoClient, ServerApiVersion ,  ObjectId} = require('mongodb');


app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.du8ko.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();

    const userCollection = client.db('taskDb').collection('user')
    const taskCollection = client.db('taskDb').collection('task')
    const submissionCollection = client.db('taskDb').collection('submission')
    const paymentsCollection = client.db('taskDb').collection('payments')
    const withdrawalsCollection = client.db('taskDb').collection('withdrawals')
    const notificationCollection = client.db('taskDb').collection('notifications')


    // jwt related apis

app.post('/jwt' , async(req , res) =>{
  const user = req.body
  const token = jwt.sign(user , process.env.ACCESS_TOKEN , {
    expiresIn: '1h'
  })
  res.send({token})

})


const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "No token provided." });
  }

  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Invalid or expired token." });
    }
    req.decoded = decoded;
    next();
  });
};



const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email; 
  const query = { email };

  const user = await userCollection.findOne(query);
  if (user?.role !== 'Admin') {
    return res.status(403).send({ message: "Forbidden access. Admins only." });
  }
  next();
};


const verifyBuyer = async (req, res, next) => {
  const email = req.decoded.email; 
  const query = { email };

  const user = await userCollection.findOne(query);
  if (user?.role !== 'Buyer') {
    return res.status(403).send({ message: "Forbidden access. Buyers only." });
  }
  next();
};



const verifyWorker = async (req, res, next) => {
  const email = req.decoded.email; 
  const query = { email };

  const user = await userCollection.findOne(query);
  if (user?.role !== 'Worker') {
    return res.status(403).send({ message: "Forbidden access. Workers only." });
  }
  next();
};
    // user related apis


    app.post('/users' , async(req , res) =>{
      const user = req.body
      const query = {email : user.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        return res.send({messege : 'user already exist'})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
      
      
          })


  //  update buyer coin       // 

          app.patch('/users_coin/:id' , async( req,res) =>{
            const id = req.params.id
           
            const filter = { _id: new ObjectId(id) }
            
            const {coins} = req.body
            const updatedDoc = {
              $set: {
               coins ,
              },
            };
            const result = await userCollection.updateOne(
              filter,
              updatedDoc
            );
            res.send(result);

       


          })

// updated worker coin
          app.patch('/increase-coin/:submissionId', verifyToken, verifyBuyer, async (req, res) => {
            const { submissionId } = req.params;
            try {

              const submission = await submissionCollection.findOne({ _id: new ObjectId(submissionId) });
            
              const workerEmail = submission.worker_email;
      
              const worker = await userCollection.findOne({ email: workerEmail });
              if (!worker) {
                return res.status(404).send({ message: 'Worker not found' });
              }
   
              const updatedCoins = (worker.coins || 0) + (submission.amount || 0);
      
              const result = await userCollection.updateOne(
                { email: workerEmail },
                { $set: { coins: updatedCoins } }
              );
              res.send(result)
          
              // if (result.modifiedCount > 0) {
              //   res.send({ message: 'Worker coins updat ed successfully' });
              // } else {
              //   res.status(400).send({ message: 'Failed to update worker coins' });
              // }
            } catch (error) {
              console.error(error);
              res.status(500).send({ message: 'Internal Server Error' });
            }
          });
          





 app.get('/users' ,verifyToken  ,async(req , res) =>{
  const email = req.query.email
  const query ={ email }
    const result = await userCollection.find(query).toArray()
  res.send(result)    
              

  })


 




  app.get('/allusers' ,verifyToken,async(req , res) =>{ 
    const result = await userCollection.find().toArray()
    res.send(result)
})



app.delete('/allusers/:id',verifyToken, verifyAdmin, async(req , res) =>{
  const id = req.params.id
  const query ={ _id : new ObjectId(id)}

  const result = await userCollection.deleteOne(query)
  res.send(result)
})



app.patch('/allusers/:id',verifyToken,verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );
    res.send(result);
 
});


  // task added apis


  app.post('/tasks' , async(req , res) =>{
    const user = req.body
    const result = await taskCollection.insertOne(user)
    res.send(result)
    
    
        })

        app.get('/alltasks' ,async(req , res) =>{
       
          const result = await taskCollection.find().toArray()
          res.send(result)
      })


      app.get('/alltasks/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
    const result = await taskCollection.findOne(query);
  res.send(result);
  
    });


app.delete('/alltasks/:id',verifyToken,verifyAdmin, async(req , res) =>{
  const id = req.params.id
  const query ={ _id : new ObjectId(id)}

  const result = await taskCollection.deleteOne(query)
  res.send(result)
})

      

  app.get('/tasks' ,verifyToken,async(req , res) =>{
    const email = req.query.email
    const query ={email :email}
    const result = await taskCollection.find(query).toArray()
    res.send(result)
})


app.delete('/tasks/:id',verifyToken,verifyBuyer, async(req , res) =>{
  const id = req.params.id
  const query ={ _id : new ObjectId(id)}

  const result = await taskCollection.deleteOne(query)
  res.send(result)
})

// submission apis

app.post('/submission' , async(req , res) =>{
  const submission = req.body 
  // const submissionNotify = await submissionCollection.findOne({ _id: new ObjectId(id) });

  
  const {worker_email, buyer_email, worker_name,}= submission
  const result = await submissionCollection.insertOne(submission)
  if (result.acknowledged) {
    // Add a notification based on the new status

    let actionRoute = "/dashboard/buyerhome";

   
      message = `Inserted a new submission by ${worker_name}`;
  

    const notification = {
      message,
      toEmail: buyer_email,
      actionRoute,
      time: new Date(),
    };

    // Insert the notification into the notification collection
    await notificationCollection.insertOne(notification);
  }
  res.send(result)
  
  
      })




  

 
   app.patch("/alltasks/:id", async (req, res) => {
        const id = req.params.id
        const filter = { _id: new ObjectId(id) };
        const { workers } = req.body;
       
        const updatedDoc = {
          $set: {
            workers
          },
        };
        const result = await taskCollection.updateOne(
          filter,
          updatedDoc
        );
        res.send(result);
      });

  app.patch("/tasks-worker-upgrade/:id", async (req, res) => {
    const id = req.params.id
    const filter = { _id: new ObjectId(id) };
   


  const updatedDoc = { $inc: { workers: 1 } };
    const result = await taskCollection.updateOne(
      filter,
      updatedDoc
    );
    res.send(result);
    });




app.patch('/tasks/:id', verifyToken, verifyBuyer, async (req, res) => {
  const { id } = req.params;  
  const { title, detail, submission } = req.body;  

  const filter = { _id: new ObjectId(id) };  
  const updateDoc = {
    $set: {
      title,  
      detail,  
      submission,  
    }
  };

 
    const result = await taskCollection.updateOne(filter, updateDoc);
    res.send(result)
});

  
 // Update user's coins after task deletion
app.patch('/users_coin/:id', verifyToken, async (req, res) => {
  const id = req.params.id; 
  const { coins } = req.body;  

  const filter = { _id: new ObjectId(id) };  
  const updatedDoc = {
    $set: {
      coins: coins,  
    },
  };

  
    const result = await userCollection.updateOne(filter, updatedDoc);
 res.send(result)
 
});
 
  
      app.get("/submission",verifyToken, async (req, res) => {
        const email = req.query.email;
        const query = {
         buyer_email: email,
        };
        const result = await submissionCollection.find(query).toArray();
        res.send(result);
      });


   app.patch("/submission/:id",verifyToken,verifyBuyer, async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const submission = await submissionCollection.findOne({ _id: new ObjectId(id) });

      if (!submission) {
        return res.status(404).send({ error: "Submission not found" });
      }
      const { worker_email, buyer_email, buyer_name, title, amount } = submission;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status,
        },
      };
      const result = await submissionCollection.updateOne(
        filter,
        updatedDoc
      );

    if (result.modifiedCount > 0) {
      // Add a notification based on the new status
      let message;
      let actionRoute = "/dashboard/workerhome";

      if (status === "approve") {
        message = `You have earned ${amount} coins from ${buyer_name} for completing ${title}`;
      } else if (status === "rejected") {
        message = `Your submission for ${title} has been rejected by ${buyer_email}`;
      }

      const notification = {
        message,
        toEmail: worker_email,
        actionRoute,
        time: new Date(),
      };

      // Insert the notification into the notification collection
      await notificationCollection.insertOne(notification);
    }
      res.send(result);
    });


app.get("/submission/worker",verifyToken,verifyWorker, async (req, res) => {
  const { email, status } = req.query;

  const query = {
    worker_email: email, 
    ...(status && { status })
  };

  const result = await submissionCollection.find(query).toArray();
  res.send(result);
});


app.get("/submission/buyer",verifyToken,verifyBuyer, async (req, res) => {
  const { email, status } = req.query;

  const query = {
    buyer_email: email, 
    ...(status && { status })
  };

  const result = await submissionCollection.find(query).toArray();
  res.send(result);
});





app.get("/submission/workeralltask", verifyToken, verifyWorker, async (req, res) => {
  try {
    const email = req.query.email;
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const skip = (page - 1) * limit; 
    const query = { worker_email: email };

    const totalSubmissions = await submissionCollection.countDocuments(query);

   
    const submissions = await submissionCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    
    res.send({
      submissions,
      totalSubmissions,
      totalPages: Math.ceil(totalSubmissions / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).send({ error: "Error fetching submissions" });
  }
});






// role based apis


app.get('/users/admin/:email', verifyToken, async(req , res) =>{
  const email= req.params.email

  if(email  !== req.decoded.email){
    return res.status(403).send({message : 'forbidden access'})
  }
  const query ={ email: email}

  const user= await userCollection.findOne(query)
  let admin = false
  if(user){
    admin = user?.role === 'Admin'
  }
  res.send({admin})
})



app.get('/users/buyer/:email', verifyToken, async(req , res) =>{
  const email= req.params.email

  if(email  !== req.decoded.email){
    return res.status(403).send({message : 'forbidden access'})
  }
  const query ={ email: email}

  const user= await userCollection.findOne(query)
  let buyer = false
  if(user){
    buyer = user?.role === 'Buyer'
  }
  res.send({buyer})
})



app.get('/users/worker/:email', verifyToken, async(req , res) =>{
  const email= req.params.email

  if(email  !== req.decoded.email){
    return res.status(403).send({message : 'forbidden access'})
  }
  const query ={ email: email}

  const user= await userCollection.findOne(query)
  let worker = false
  if(user){
    worker = user?.role === 'Worker'
  }
  res.send({worker})
})


// payment intrigation

app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;


    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, 
      currency: 'usd',
      payment_method_types: ['card'],
    });


    res.send(
      {  clientSecret: paymentIntent.client_secret, });

});


app.post('/payments', async (req, res) => {
  const { userId, coins, amount, transactionId, date , email } = req.body;

  try {
    // Save payment info
    const payment = await paymentsCollection.insertOne({
      userId,
      coins,
      amount,
      transactionId,
      date,
      email
    });

    

    // Update user's coin balance
    const updateUser = await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { coins } }
    );

    if (payment.insertedId && updateUser.modifiedCount > 0) {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Failed to process payment.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.get('/allpayments' ,verifyToken,async(req , res) =>{ 
  const result = await paymentsCollection.find().toArray()
  res.send(result)
})


app.get("/payments", async (req, res) => {
  const email = req.query.email;
  const query = {
  email: email,
  };
  const result = await paymentsCollection.find(query).toArray()
  res.send(result);
});


// withdrawals

app.post('/withdrawals' , async(req , res) =>{
  const withdrawalData = req.body
  const result = await withdrawalsCollection.insertOne(withdrawalData)
  res.send(result)
  
  
      })

      app.get('/withdrawals', async (req, res) => {

    const status = req.query.status || 'pending'; 
    const withdrawals = await withdrawalsCollection.find({ status }).toArray();

    res.send(withdrawals);
 
});

app.patch('/withdrawals/:id', async (req, res) => {
  try {
    const withdrawalId = req.params.id; 
    const { status, withdrawalAmount, userEmail } = req.body; 
    if (!status || !withdrawalAmount || !userEmail) {
      return res.status(400).send({ message: "Status, withdrawal amount, and user email are required." });
    }

 
    const withdrawalUpdate = await withdrawalsCollection.updateOne(
      { _id: new ObjectId(withdrawalId), status: 'pending' }, 
      { $set: { status: 'approved' } }
    );

    if (withdrawalUpdate.modifiedCount === 0) {
      return res.status(404).send({ message: "Withdrawal request not found or already approved." });
    }


    const user = await userCollection.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const currentCoins = user.coins || 0;
    if (currentCoins < withdrawalAmount) {
      return res.status(400).send({ message: "Insufficient coins for withdrawal." });
    }

    
    const updatedCoins = parseInt(currentCoins - withdrawalAmount);
    const userUpdate = await userCollection.updateOne(
      { email: userEmail },
      { $set: { coins: updatedCoins } }
    );

    if (userUpdate.modifiedCount === 0) {
      return res.status(500).send({ message: "Failed to update user's coin balance." });
    }

 
    res.status(200).send({ message: "Withdrawal approved and user coins updated successfully." });
  } catch (error) {
    console.error("Error approving withdrawal request:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


// notifications get 

app.get('/notifications',verifyToken, async(req,res)=>{
const { toEmail } = req.query;
 if (!toEmail) {
      return res.status(400).send({ error: "toEmail query parameter is required" });
    }

   const notifications = await notificationCollection
      .find({ toEmail })
      .sort({ time: -1 })
      .toArray();

    res.send(notifications);
})


// app.patch("/submission/status/:id", verifyToken, verifyBuyer, async (req, res) => {
//   const submissionId = req.params.id;
//   const { status } = req.body;

//   try {
//     const submission = await submissionCollection.findOne({ _id: submissionId });

//     if (!submission) {
//       return res.status(404).send({ error: "Submission not found" });
//     }

//     const updateResult = await submissionCollection.updateOne(
//       { _id: submissionId },
//       { $set: { status } }
//     );

//     // Add notification if status changes
//     if (status === "approved" || status === "rejected") {
//       const notification = {
//         message: `Your submission for ${submission.title} has been ${status} by ${submission.buyer_name}.`,
//         toEmail: submission.worker_email,
//         actionRoute: "/dashboard/worker-home",
//         time: new Date(),
//       };

//       await notificationCollection.insertOne(notification);
//     }

//     res.send(updateResult);
//   } catch (error) {
//     console.error("Error updating submission status:", error);
//     res.status(500).send({ error: "Error updating submission status" });
//   }
// });


// app.patch("/withdrawals/:id", verifyToken, verifyAdmin, async (req, res) => {
//   const withdrawalId = req.params.id;
//   const { status, withdrawalAmount, userEmail } = req.body;

//   try {
//     const updateResult = await withdrawalsCollection.updateOne(
//       { _id: withdrawalId },
//       { $set: { status } }
//     );

//     if (status === "approved") {
//       const notification = {
//         message: `Your withdrawal request of $${withdrawalAmount} has been approved.`,
//         toEmail: userEmail,
//         actionRoute: "/dashboard/worker-home",
//         time: new Date(),
//       };

//       await notificationCollection.insertOne(notification);
//     }

//     res.send(updateResult);
//   } catch (error) {
//     console.error("Error approving withdrawal request:", error);
//     res.status(500).send({ error: "Error approving withdrawal request" });
//   }
// });



// app.post("/submission", verifyToken, verifyWorker, async (req, res) => {
//   const submission = req.body;

//   try {
//     const insertResult = await submissionCollection.insertOne(submission);

//     const notification = {
//       message: `A new submission titled "${submission.title}" has been sent by ${submission.worker_name}.`,
//       toEmail: submission.buyer_email,
//       actionRoute: "/dashboard/buyer-home",
//       time: new Date(),
//     };

//     await notificationCollection.insertOne(notification);

//     res.send(insertResult);
//   } catch (error) {
//     console.error("Error inserting submission:", error);
//     res.status(500).send({ error: "Error inserting submission" });
//   }
// });

 
      

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req , res) =>{
  res.send('Taskpeks is running ')
})
app.listen(port, () => {
  console.log(`Taskperks is running from port ${port}`)
})
