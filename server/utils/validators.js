exports.validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

exports.validatePassword = (password) => {
  return password && password.length >= 6;
};

exports.validateEmployeeId = (id) => {
  return id && id.trim().length > 0;
};

exports.validateAgentCode = (code) => {
  return code && code.trim().length > 0;
};
