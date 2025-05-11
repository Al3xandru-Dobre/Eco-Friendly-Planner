module.exports.validateRegisterInput = (
    name,
    email,
    password,
    confirmPassword
  ) => {
    const errors = {};
    if (name.trim() === '') {
      errors.name = 'Name must not be empty';
    }
    if (email.trim() === '') {
      errors.email = 'Email must not be empty';
    } else {
      const regEx = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!email.match(regEx)) {
        errors.email = 'Email must be a valid email address';
      }
    }
    if (password === '') {
      errors.password = 'Password must not be empty';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords must match';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
  
    return {
      errors,
      valid: Object.keys(errors).length < 1,
    };
  };
  
  module.exports.validateLoginInput = (email, password) => {
    const errors = {};
    if (email.trim() === '') {
      errors.email = 'Email must not be empty';
    }
    if (password.trim() === '') {
      errors.password = 'Password must not be empty';
    }
    return {
      errors,
      valid: Object.keys(errors).length < 1,
    };
  };