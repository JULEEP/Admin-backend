const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    quantity: {
      type: Number,
    },
    discountPrice: {
      type: Number,
    },
    color: String
  }],
  paymentMethod: {
    type: String,
    enum: ['COD', 'card'] // Add allowed payment methods here
  },
  paymentIntent: {
    shippingMethod: {
      type: String,
      enum: ['COD', 'card'] // Add allowed payment methods here
    },
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShippingAddress',
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'card'] // Add allowed payment methods here
    },
    id: String,
    amount: Number,
    totalPrice: Number,
    status: String,
    created: Date,
    orderType: {
      type: String,
      default: "delivery"
    }, currency: String,
    cardNumber: String,
    cardHolder: String,
    cvv: String
  },
  id: String,
  amount: Number,
  totalPrice: Number,
  status: String,
  created: Date,
  orderType: {
    type: String,
    default: "delivery"
  }, currency: String,
  cardNumber: String,
  cardHolder: String,
  cvv: String,
  isScheduled: { type: Boolean, default: false },
  isCancelled: { type: Boolean, default: false },
  seller: { // Change this from 'sellerId' to 'seller'
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
  },
  cancelReason: {
    type: String,
    enum: [
      'Out of stock',
      'Change of mind',
      'Found a better price',
      'Ordered by mistake',
      'Other'
    ],
  },
  cancelReasons: {
    type: String,
    enum: [
      'Change of mind',
      'Incorrect item',
      'Damaged item',
      'Late delivery',
      'Other'
    ],
  },
  cancelledAt: {
    type: Date
  },
  orderStatus: {
    type: String,
    default: "Not Processed",  // Default status
    enum: [
      "Draft", 
      "Payment Pending", 
      "Payment Confirmed", 
      "Order Confirmed", 
      "Print Ready", 
      "Shipped", 
      "Delivered", 
      "Processing", 
      "Refund request", 
      "Confirmed", 
      "Return Requested", 
      "Cancelled", 
      "CancelledRequest", 
      "Refund Success", 
      "Placed", 
      "Not Processed", 
      "Pending", 
      "Scheduled", 
      "Unshipped", 
      "Transferred to delivery partner", 
      "Received", 
      "Cancel request", 
      "Out for Delivery", 
      "Shipping", 
      "Processing Refund"
    ],  // Enum of possible statuses
  },
  orderStatusHistory: {
    type: [String],  // Store status as string, not ObjectId
    default: [],
  },
  cancellationReason: {
    type: String,
    enum: ['NoInventory', 'buyerCancelled', 'generalAdjustment', 'undeliverableShippingAddress', 'customerExchange', 'pricingError'],
    required: function () { return this.orderStatus === 'Cancelled'; }
  },
  shippingTime: {
    type: Date,
    default: null
  },
  cancellationReason: { type: String }, // Add this field to store the cancellation reason
  actions: { type: [String], default: ['schedulePickup', 'printPackingSlip', 'printTaxInvoice', 'cancelOrder'] },
  deliveredIn: {
    type: String,
  },
  processingStartTime: { type: Date, default: Date.now }, // Store the time when processing starts
  shippingStartTime: { type: Date, default: Date.now }, // Store the time when shipping starts
  deliveryCharge: {
    type: Number,
  },
  currency: {
    type: String,
    default: "AED"
  },
  chargeId: { type: String }, // Unique Order ID
  paymentStatus: String,
  paidAt: {
    type: Date,
    default: Date.now(),
  },
  paymentInfo: {
    id: {
      type: String,
    },
    status: {
      type: String,
    },
    type: {
      type: String,
    },
  },
  placedAt: {
    type: Date,
    default: Date.now
  },
  shippedAt: {
    type: Date
  },
  outForDeliveryAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  reason: String,
  comments: String,
  statusField: String,
  currencyField: String,
  orderStatusField: String,
  sessionId: String, // Add sessionId field
  isReturned: { type: Boolean, default: false },
  returnReason: {
    type: String,
    enum: ['Wrong Item', 'Damaged Item', 'Incorrect Size/Color', 'Not Satisfied', 'Other'],
  },
  returnPhotos: [String], // Array of URLs or paths to photos
  returnVideos: [String], // Array of URLs or paths to videos
  returnRequestedAt: { type: Date },
  bankDetails: {
    swiftBic: String,
    iban: String,
    accountNumber: String,
    accountHolder: String,
    currency: String,
    bankName: String,
    bankAddress: String,
  },
  order: {
    data: [
      {
        apiResponse: Object, // Adjust the type based on the structure of your API response
        // add any other fields if necessary
      }
    ]
  },
  tapResponse: {
    id: String,
    amount: Number,
    status: String,
    currency: String,
    customer_initiated: Boolean,
    threeDSecure: Boolean,
    save_card: Boolean,
    statement_descriptor: String,
    metadata: Object,
    reference: {
      transaction: String,
      order: String
    },
    receipt: {
      email: Boolean,
      sms: Boolean
    },
    customer: {
      first_name: String,
      middle_name: String,
      last_name: String,
      email: String,
      phone: {
        country_code: String,
        number: String
      }
    },
    merchant: {
      id: String
    },
    source: {
      id: String
    },
    authorize_debit: Boolean,
    auto: {
      type: String,
      time: Number
    },
    post: {
      url: String
    },
    redirect: {
      url: String
    }
  }

}, {
  timestamps: true
});


const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
