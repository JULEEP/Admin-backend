const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true, // It's a good practice to include this as well
    })
    .then((data) => {
      console.log(`Server is connected with server: ${data.connection.host}`);
    })
    .catch((error) => {
      console.error("Database connection error:", error);
    });
};

module.exports = connectDatabase;
