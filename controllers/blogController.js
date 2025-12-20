import Blog from "../models/Blog.js";

// ➕ Create Blog (author auto from token)
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      featuredImage,
      status,
      seo,
    } = req.body;

    const blog = await Blog.create({
      title,
      content,
      category,
      featuredImage,
      status,
      seo,

      // 🔐 AUTO AUTHOR
      author: req.user._id,
      authorName: req.user.name,
    });

    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📄 Get All Blogs (Admin + Frontend list)
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📦 Get Blog By Slug (Frontend + views++)
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: "published" },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("category", "name slug");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📝 Update Blog
export const updateBlog = async (req, res) => {
  try {
    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ❌ Delete Blog
export const deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
