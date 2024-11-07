const mongoose = require("mongoose");

// Set Mongoose's strictQuery option to either true or false
mongoose.set("strictQuery", true); // Set to false if you prefer that behavior

const conntectDB = async () => {
  console.log("process.env.DB_URI", process.env.DB_URI);
  try {
    let myConnection = await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      //   useCreateIndex: true,
    });
    console.log(
      `MongoDb server is conntected at server ${myConnection.connection.host}`
    );
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = conntectDB;
