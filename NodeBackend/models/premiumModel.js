const appConfigSchema = new mongoose.Schema({
    premiumPrice: { type: Number, required: true },
    currentDiscount: {
      percentage: Number,
      validUntil: Date,
      description: String
    }
}, { timestamps: true }); 