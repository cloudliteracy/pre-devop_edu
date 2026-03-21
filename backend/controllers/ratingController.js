const Rating = require('../models/Rating');

exports.submitRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const existingRating = await Rating.findOne({ userId });

    if (existingRating) {
      existingRating.rating = rating;
      await existingRating.save();
      return res.json({ message: 'Rating updated successfully', rating: existingRating });
    }

    const newRating = new Rating({ userId, rating });
    await newRating.save();
    res.status(201).json({ message: 'Rating submitted successfully', rating: newRating });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit rating', error: error.message });
  }
};

exports.getRatingStats = async (req, res) => {
  try {
    const ratings = await Rating.find();
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : 0;

    res.json({ averageRating: parseFloat(averageRating), totalRatings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get rating stats', error: error.message });
  }
};
