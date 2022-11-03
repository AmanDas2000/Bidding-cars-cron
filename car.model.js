const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const carSchema = new Schema({
  carCompany: { type: String,
    // required: true
  },
  photos: {
    type: Array,
    required:true
  },
  modelName: { type: String,
  // required: true
  },
  modelYear: { type: String,
 // required: true
  },
  description: { type: String,
    // required: true
  },
  color: { type: String,
    // required: true
  },
  kilometersDriven: { type: Number,
    // required: true
  },
  condition: { type: String,
    // required: true
  },
  basePrice: { type: Number,
    // required: true
  },
  fullPrice: { type: Number,
    // required: true
  },
  ownerId: { type: mongoose.Schema.Types.ObjectId,
    refPath: 'User',
    required:true
  },
  currentBid: {
    type: Number,
    default:0,
    // required: true
  },
  numberOfBids: {
    type: Number,
    default:0
  },
  endTime: {
    type: Date,
    // required: true
  },
  ownerId: { type: mongoose.Schema.Types.ObjectId,
    refPath: 'User',
  },
  status: {
    type: String,
    enum: ["pending for approval", "approved","rejected","sold"],
    required: true,
  },
  lock: {
    type: Boolean,
    default:false
  }
}, {
  timestamps: true,
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car;