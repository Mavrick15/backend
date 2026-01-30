const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Zetoun Labs',
  },
  tagline: {
    type: String,
    trim: true,
    default: "L'expertise au service de votre avenir numérique",
  },
  description: {
    type: String,
    trim: true,
  },
  mission: {
    type: String,
    trim: true,
  },
  vision: {
    type: String,
    trim: true,
  },
  values: [{
    title: String,
    description: String,
  }],
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
  },
  contact: {
    email: String,
    phone: String,
    whatsapp: String,
    website: String,
  },
  socialMedia: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    youtube: String,
  },
  logo: {
    type: String,
    trim: true,
  },
  foundedYear: {
    type: Number,
  },
  teamSize: {
    type: Number,
    min: 0,
  },
  certifications: [{
    name: String,
    issuer: String,
    year: Number,
  }],
  partners: [{
    name: String,
    logo: String,
    website: String,
  }],
}, {
  timestamps: true,
});

// S'assurer qu'il n'y a qu'un seul document Company
companySchema.statics.getCompany = async function() {
  let company = await this.findOne();
  if (!company) {
    company = await this.create({
      name: 'Zetoun Labs',
      tagline: "L'expertise au service de votre avenir numérique",
    });
  }
  return company;
};

module.exports = mongoose.model('Company', companySchema);
