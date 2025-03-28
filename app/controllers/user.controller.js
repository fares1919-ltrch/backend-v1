exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};
exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};
exports.managerBoard = (req, res) => {
  res.status(200).send("Manager Content.");
};
exports.officerBoard = (req, res) => {
  res.status(200).send("Officer Content.");
};
