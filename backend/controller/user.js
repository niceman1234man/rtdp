import User from '../model/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';



export const createUser = async (req, res) => {
    try {
    const { firstName, lastName, email, password, role, organization, fieldOfStudy } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ firstName, lastName, email, password: hashedPassword, role, organization, fieldOfStudy });
    await newUser.save();
     const secret = process.env.ACCESS_TOKEN_SECRET || process.env.TOKEN_SECRET || 'dev-secret'
    if (!process.env.ACCESS_TOKEN_SECRET) {
      console.warn('ACCESS_TOKEN_SECRET is not set — using fallback dev secret (insecure for production)')
    }
    const accessToken = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      secret,
      { expiresIn: "10h" } 
    );

    return res.status(201).json({
      error: false,
      accessToken,
      message: "User registered successfully",
    });
    } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: "Please fill all fields" });
    }
    const userInfo = await User.findOne({ email });
    if (!userInfo) {
      return res.status(404).json({ error: true, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, userInfo.password);
    if (!isMatch) {
      return res.status(401).json({ error: true, message: "Invalid password" });
    }
    const accessToken = jwt.sign(
      { id: userInfo._id, userId: userInfo._id, email: userInfo.email, role: userInfo.role },
      process.env.TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "2h" } 
    );

    console.log(`User ${userInfo.email} logged in with ID: ${userInfo._id}`);

   

    res.status(200).json({
      error: false,
      userInfo,
      accessToken,
      message: "Login successful",

    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};


export const updatePassword = async (req, res) => {
  try {
    // support both authenticated requests (req.user.userId) and direct id param
    const targetId = (req.user && req.user.userId) || req.params.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Please confirm correctly!" });
    }
    const existingUser = await User.findById(targetId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(oldPassword, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    existingUser.password = hashedPassword;
    await existingUser.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const ForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(200).json({ success: true, message: "If the email exists, a reset link will be sent." });
      }

      console.log(`Password reset requested for: ${email}`);

      // Ensure the secret is available
      if (! process.env.ACCESS_TOKEN_SECRET) {
          console.error("Access token secret is not defined.");
          return res.status(500).json({ success: false, message: "Internal server error." });
      }

      const accessToken = jwt.sign(
          { userId: user._id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "3d" }
      );

      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.USER_EMAIL,
              pass: process.env.PASSWORD,
          },
      });

      const resetUrl = `http://localhost:5173/reset-password/${user._id}/${accessToken}`;
      const mailOptions = {
          from: process.env.USER_EMAIL,
          to: user.email,
          subject: 'Reset Your Password',
          text: `Click the link below to reset your password:\n\n${resetUrl}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error("Error sending email:", error);
              return res.status(500).json({ success: false, message: "Error sending email. Please try again later." });
          }
          console.log(`Password reset email sent: ${info.response}`);
          res.status(200).json({ success: true, message: "Password reset link sent to your email." });
      });

  } catch (error) {
      console.error("Internal server error:", error);
      res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
  }
};
export const ResetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
   console.log("id of :",id);
   console.log("token :",token);
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.userId !== id) {
      return res.status(400).json({ success: false, message: "Invalid token or user ID mismatch." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ success: false, message: "Invalid token." });
    }

    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
    }
}
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id
, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
    }
}
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted' });
    } catch (error) {
    res.status(500).json({ message: 'Server error' });
    }
}