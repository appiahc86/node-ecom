const express = require("express");
const couponGen = require("../scripts/couponGen");
const router = express.Router();
const { Category } = require("../../models/category");
const Product = require("../../models/product");
const cloudinary = require("../scripts/cloudinary");
const Coupon = require("../../models/coupon");
const fs = require("fs");
const moment = require("moment");
const Validator = require("validatorjs");
const { Console } = require("console");
const { resolve } = require("path");


//DELETING coupon
router.delete('/coupon/:id',async (req,res)=>{
  const coupon=await Coupon.findByIdAndDelete(req.params.id)
  req.flash("sucess_msg",`${coupon.code} is successfully deleted`)
  res.redirect(req.headers.referer)
  // console.log(coupon)

   
})


//coupon generation route
router.get("/coupon", async (req, res) => {
  const pcount = await Product.countDocuments();
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });

  const genCoupon = couponGen();

  res.render("admin/coupon", { pcount, genCoupon, coupons });
});

router.post("/coupon", async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  const pcount = await Product.countDocuments();

  errors = [];
  const { code, date, worth } = req.body;
  console.log(date)

  const validation = new Validator(
    {
      code: code,
      date: date,
      worth: worth,
    },
    {
      code: "string|required",
      date: "date|required|string",
      worth: "required",
    }
  );

  if (validation.fails()) {
    const errCode = validation.errors.get("code");
    const errDate = validation.errors.get("date");
    const errWrth = validation.errors.get("worth");
    errors.push(errCode, errDate, errWrth);

    res.render("admin/coupon", {
      errors,
      pcount,
      code,
      date,
      worth,
      coupons,
    });
  } else {
    validation.passes(async () => {
      let newCoupon = new Coupon({
        code,
        worth,
        expireDate: date,
      });
      newCoupon = await newCoupon.save();
      //console.log(newCoupon)
      res.redirect(req.headers.referer);

      // console.log(date,code,worth)
    });
  }
});


// POST  ADDING PRODUCT
router.post("/upload", async (req, res) => {
  // console.log(req.body.feature)

  errors = [];
  const { desc, name, rdesc, category, price, stockCount } = req.body;
  const validation = new Validator(
    {
      name: req.body.name,
      description: req.body.desc,
      rDesc: req.body.rdesc,
      category: req.body.category,
      price: req.body.price,
      countInStock: req.body.stockCount,
      featured: req.body.feature,
      worth: req.body.worth,
    },
    {
      name: "string|required",
      description: "required|string",
      rDesc: "required",
      category: "required",
      price: "numeric|required",
      countInStock: "numeric|required",
      featured: "required",
      worth: "required",
    }
  );
  if (validation.fails()) {
    const errName = validation.errors.get("name");
    const errDesc = validation.errors.get("description");
    const errR_Desc = validation.errors.get("rDesc");
    const errCat = validation.errors.get("category");
    const errPrc = validation.errors.get("price");
    const errCStock = validation.errors.get("countInStock");
    const errFeatured = validation.errors.get("featured");
    const errWorth = validation.errors.get("worth");

    errors.push(
      errName,
      errDesc,
      errR_Desc,
      errCat,
      errPrc,
      errCStock,
      errFeatured,
      errWorth
    );
    Category.find({})
      .sort({ name: 1 })
      .then((categories) => {
        res.render("admin/addproduct", {
          errors,
          categories,
          desc,
          name,
          rdesc,
          category,
          price,
          stockCount,
        });
      });
  } else {
    validation.passes(async () => {
      try {
        const urls = [];

        const uploader = async (path) =>
          await cloudinary.uploads(path, "Images");

        let files = [req.files];
        files = files[0].image;
        // console.log(files);
        for (const file of files) {
          const tmp_file = file.tempFilePath;

          const newPath = await uploader(tmp_file);
          urls.push(newPath);
          fs.unlinkSync(tmp_file);
        }
        console.log(urls);

        let newProduct = new Product({
          name: req.body.name,
          description: req.body.desc,
          richDescription: req.body.rdesc,
          category: req.body.category,
          price: req.body.price,
          countInStock: req.body.stockCount,
          feature: req.body.feature,
          image: urls,
          worth: req.body.worth,
        });
        newProduct = await newProduct.save();
        req.flash("success_msg", `Successfully Added ${newProduct.name}`);

        res.redirect("/admin/products/all");
      } catch (e) {
        console.log(e.message);
      }
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const pcount = await Product.countDocuments();
    res.render("admin/index", { pcount });
  } catch (e) {
    console.log(e.message);
  }
});

router.get("/add-product", async (req, res) => {
  const pcount = await Product.countDocuments();

  Category.find({})
    .sort({ createdAt: -1 })
    .then((categories) => {
      res.render("admin/addproduct", {
        categories,
        pcount,
      });
    });
});

//Add product
router.get("/add-category", async(req, res) => {
  Category.find({})
    .sort({ name: 1 })
    .then(async(categories) => {
  const pcount = await Product.countDocuments();

      res.render("admin/addcategory", {
        categories,
        pcount
      });
    });
});

// edit category
router.get("/category/edit/:id", async (req, res) => {
  const { id } = req.params;
  Category.find({ _id: id }).then(async (CAtegory) => {
    Category.find({})
      .sort({ name: 1 })
      .then(async (categories) => {
        const pcount = await Product.countDocuments();

        res.render("admin/editcategory", {
          categories,
          CAtegory,
          id,
          pcount
        });
      });
  });
});
router.get("/edit/category", (req, res) => {
  Category.find({})
    .sort({ name: -1 })
    .then(async (categories) => {
      const pcount = await Product.countDocuments();

      res.render("admin/editcategories", {
        categories,
        pcount
      });
    });
});

//update category
router.put("/category/edit/:id", (req, res) => {
  errors = [];
  const validation = new Validator(
    {
      name: req.body.name,
    },
    {
      name: "required",
    }
  );
  if (validation.fails()) {
    const errFullName = validation.errors.get("name");
    errors.push(errFullName);

    res.render("admin/addcategory", { errors });
  }
  validation.passes(async () => {
    try {
      let cat = await Category.findById(req.params.id);
      //console.log(cat.catCover)
      const { id } = req.params;
      var files;
      //if user adds a new image to category
      if (req.files) {
        const uploader = async (path) =>
          await cloudinary.uploads(path, "Images");
        files = [req.files];
        const tmp_file = files[0].image.tempFilePath;
        console.log(tmp_file);

        const newPath = await uploader(tmp_file);
        fs.unlinkSync(tmp_file);
        Category.findByIdAndUpdate(
          { _id: id },
          {
            $set: {
              name: req.body.name,
              catCover: newPath,
            },
          }
        ).then((catUpdate) => {
          req.flash(
            "success_msg",
            `Update Done For ${catUpdate.name} category!`
          );
          res.redirect("/admin/edit/category");
        });
      } else {
        files = cat.catCover;
        Category.findByIdAndUpdate(
          { _id: id },
          {
            $set: {
              name: req.body.name,
              catCover: files,
            },
          }
        ).then((catUpdate) => {
          req.flash(
            `success_msg','Update Done For ${catUpdate.name} category!`
          );
          res.redirect("/admin/edit/category");
        });
      }
      //console.log(files)

      // Category.find({ _id: id }).then((CAtegory) => {
      //   Category.find({})
      //     .sort({ name: 1 })
      //     .then((categories) => {
      //       Category.findByIdAndUpdate(
      //         { _id: id },
      //         {
      //           $set: {
      //             name: req.body.name,
      //           },
      //         },
      //         { new: true }
      //       ).then((update) => {
      //         req.flash("success_msg", `Successfully updated ${update.name}`);
      //         res.redirect("/admin/");
      //       });
      //     });
      // });
    } catch (e) {}
  });
});

// delete category
router.delete("/category/delete/:id", (req, res) => {
  const { id } = req.params;
  Category.findByIdAndDelete({ _id: id }).then((deleted) => {
    deleted.remove();
    req.flash("success_msg", `Successfully deleted ${deleted.name}`);
    res.redirect("/admin/");
  });
});

router.post("/add-category", (req, res) => {
  let errors = [];
  const validation = new Validator(
    {
      name: req.body.name,
    },
    {
      name: "required",
    }
  );
  if (validation.fails()) {
    const errFullName = validation.errors.get("name");
    errors.push(errFullName);

    res.render("admin/addcategory", { errors });
  } else {
    validation.passes(async () => {
      try {
        const uploader = async (path) =>
          await cloudinary.uploads(path, "Images");

        let files = [req.files];
        file = files[0].image;
        const tmp_file = file.tempFilePath;
        //console.log(tmp_file);
        const newPath = await uploader(tmp_file);
        fs.unlinkSync(tmp_file);
        let { name } = req.body;
        let newCategory = new Category({
          name,
          catCover: newPath,
        });
        newCategory = await newCategory.save();
        req.flash(
          "success_msg",
          `You Have Successfully Added  a new Category, ${newCategory.name}`
        );
        res.redirect("/admin/edit/category");
      } catch (e) {}
    });
  }
});

router.get("/products/all", async (req, res) => {
  const Products = await Product.find({})

    .populate("category")
    .sort({ createdAt: -1 });
  const pcount = await Product.countDocuments();

  res.render("admin/allProducts", {
    Products,
    pcount
  });
});

//edit a product
router.get("/product/:id/edit/", (req, res) => {
  Category.find({})
    .sort({ createdAt: -1 })
    .then((categories) => {
      Product.findById(req.params.id).then((product) => {
        Category.findById(product.category).then((chosenCategory) => {
          res.render("admin/editProduct", {
            categories,
            product,
            chosenCategory,
          });
        });
      });
    });
});

//posting update of product
router.post("/product/:id/edit/", (req, res) => {
  errors = [];
  const { desc, name, rdesc, category, price, stockCount } = req.body;

  //console.log(desc);
  const validation = new Validator(
    {
      name: req.body.name,
      description: req.body.desc,
      rDesc: req.body.rdesc,
      category: req.body.category,
      price: req.body.price,
      countInStock: req.body.stockCount,
      featured: req.body.feature,
      worth: req.body.worth,
    },
    {
      name: "string|required",
      description: "required|string",
      rDesc: "required",
      category: "required",
      price: "numeric|required",
      countInStock: "numeric|required",
      featured: "required",
      worth: "required",
    }
  );
  if (validation.fails()) {
    const errName = validation.errors.get("name");
    const errDesc = validation.errors.get("description");
    const errR_Desc = validation.errors.get("rDesc");
    const errCat = validation.errors.get("category");
    const errPrc = validation.errors.get("price");
    const errCStock = validation.errors.get("countInStock");
    const errFeatured = validation.errors.get("featured");
    const errWorth = validation.errors.get("worth");

    errors.push(
      errName,
      errDesc,
      errR_Desc,
      errCat,
      errPrc,
      errCStock,
      errFeatured,
      errWorth
    );
    Category.find({})
      .sort({ name: 1 })
      .then((categories) => {
        Product.findById(req.params.id).then((product) => {
          Category.findById(product.category).then((chosenCategory) => {
            res.render("admin/editProduct", {
              errors,
              categories,
              product,
              chosenCategory,
              desc,
              name,
              rdesc,
              category,
              price,
              stockCount,
            });
          });
        });
      });
  } else {
    validation.passes(async () => {
      try {
        Product.findById(req.params.id).then(async (product) => {
          let files = [req.files];
          //an array of 4 items
          let urls = new Array(4);

          files = files[0].image;

          //an instance of the cloudingary module
          const uploader = async (path) =>
            await cloudinary.uploads(path, "Images");
          //wil be expecting 4 fies from the user,so am doing a forloop fro 0-3
          for (var i = 0; i < 4; i++) {
            let currentFile =
              typeof files[i] == "undefined" ? product.image[i] : files[i];
            // if the user does not define an index for a  specific file,I use the old picture in the db for that index
            if (typeof currentFile == "object") {
              // if the current file is a file object and nota url,I upload and assign the new url to that specific index
              let tmp_file = currentFile.tempFilePath;
              // currentFile is either url or tempfile path
              const newPath = await uploader(tmp_file);
              urls[i] = newPath;
              fs.unlinkSync(tmp_file);
            } else {
              urls[i] = currentFile;
            }
          }
          //console.log(urls)
          console.log(urls);
          Product.findByIdAndUpdate(
            { _id: req.params.id },
            {
              $set: {
                name: req.body.name,
                description: req.body.desc,
                richDescription: req.body.rdesc,
                category: req.body.category,
                price: req.body.price,
                countInStock: req.body.stockCount,
                feature: req.body.feature,
                image: urls,
                worth: req.body.worth,
              },
            },
            { new: true }
          ).then((updatedProduct) => {
            req.flash(
              "success_msg",
              `Successfully Updated ${updatedProduct.name}`
            );

            res.redirect("/admin/products/all");
          });
        });
      } catch (e) {
        console.log(e.message);
      }
    });
  }
});

router.delete("/product/:id/edit/", (req, res) => {
  Product.findByIdAndDelete({ _id: req.params.id }).then((product) => {
    product.remove();
    req.flash("success_msg", "Product successfully deleted!");
    res.redirect("/admin/products/all");
  });
});

module.exports = router;
