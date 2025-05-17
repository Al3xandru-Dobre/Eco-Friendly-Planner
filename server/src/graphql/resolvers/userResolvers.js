const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError, AuthenticationError } = require('apollo-server-express');
const User = require('../../models/User');
const { Query } = require('./tripResolvers');

const generateToken = (user) => {
        return jwt.sign(
            {id: user.id,
                email: user.email,
                name: user.name,
            },
            process.env.JWT_SECRET, {expiresIn: '1h'}
        )
    }

module.exports = {
    Query: {
        getCurrentUser: async (_, __, context) => {
          // Linia 22 la tine este probabil aici:
          if (!context.user) { // Dacă user nu a fost setat în context (din cauza problemelor de mai sus)
            throw new AuthenticationError('Not authenticated'); // Se aruncă această eroare
          }
          // Dacă context.user există, atunci se caută în BD
          const userFromDb = await User.findById(context.user.id); // Folosește context.user.id
          if (!userFromDb) {
            // Asta ar însemna că user-ul din token nu mai există în DB, ceea ce e o problemă
            throw new AuthenticationError('User from token not found in database');
          }
          return userFromDb;
        },
      },

 Mutation: {
    registerUser : async (
        _,
        {
            registerInput: {
                name,email,password,confirmPassword
            }
        }
    ) => {
        //logica pentru logare si securitate
        //validare de input
        if(password !== confirmPassword){
            throw new
                UserInputError('Passwords must match!', {
                    errors: {
                        confirmPassword: 'Passwords must match!'
                    },
                });
        }

        if(password.length < 6) {
            throw new
            UserInputError('Password must be at least 6 characters long', {
                errors :{
                    password: 'Password must be at least 6 characters long'
                },
            });

        }

        //verific daca utilizatorul exista deja

        const existingUser = await User.findOne({email});

        if(existingUser){
            throw new UserInputError('Email is already taken', {
                errors: { email: 'This email is taken' },
              });
        }

        //Creem un nou utilizator
        //parola va fi hashuita de middleware-ul Mongooes

        const newUser = new User({
            name,
            email,
            password,
        });

        const savedUser = await newUser.save();

        //Generez token JWT
        const token = generateToken(savedUser);

        return {
            token,
            user:savedUser,
        };
    },

    loginUser : async(_, {
        loginInput: {
            email, password
        }
    }) => {
        //Validare input

        const user = await User.findOne({email}).select('+password'); // selectez explicit parola

        if(!user){
            throw new UserInputError('User not found with this email', {
                errors: { general: 'Wrong credentials' }, // Mesaj generic pentru securitate
              });
        }

        const match = await user.comparePassword(password);
        if(!match) {
            throw new UserInputError('Incorrect password', {
                errors: { general: 'Wrong credentials' }, // Mesaj generic
              });
        }

        const token = generateToken(user);

        return {
            token,
            user,
        }
    }
}
}