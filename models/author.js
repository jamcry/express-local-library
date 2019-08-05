var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(function () {
  if(this.date_of_birth && this.date_of_death)
    return this.date_of_death.getYear() + "-" + this.date_of_birth.getYear();
  else
    return '-'
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

var moment = require('moment');
// Virtual for author's formatted birth date
AuthorSchema
.virtual('date_of_birth_formatted')
.get(function() {
  return this.date_of_birth ?
    moment(this.date_of_birth).format('DD/MM/YYYY') :
    '';
})

// Virtual for author's formatted death date
AuthorSchema
.virtual('date_of_death_formatted')
.get(function() {
  return this.date_of_death ?
    moment(this.date_of_death).format('DD/MM/YYYY') :
    '';
})

// Virtual for author's formatted birth date for html date fields
AuthorSchema
.virtual('date_of_birth_YYYYMMDD')
.get(function() {
  return this.date_of_birth ?
    moment(this.date_of_birth).format('YYYY-MM-DD') :
    '';
})

// Virtual for author's formatted birth date for html date fields
AuthorSchema
.virtual('date_of_death_YYYYMMDD')
.get(function() {
  return this.date_of_death ?
    moment(this.date_of_death).format('YYYY-MM-DD') :
    '';
})

//Export model
module.exports = mongoose.model('Author', AuthorSchema);