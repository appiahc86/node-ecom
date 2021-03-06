const express = require("express");
const router = express.Router();
const Validator = require("validatorjs");
const { Category } = require("../../models/category");
const Product = require("../../models/product");
const Cart = require("../../models/cart");
const Coupons = require("../../models/coupon");
const moment = require("moment");
const User = require("../../models/user");

//reducing user's cart price
router.post("/apply-coupon/:id", async (req, res) => {
  const { coupon } = req.body;
  let userCart = await Cart.findOne({ _id: req.params.id });
  const checkCoupon = await Coupons.findOne({ code: coupon });
  if (checkCoupon) {
    let fmt = "YYYY-MM-DD";
    const now = moment().format(fmt);
    let dbDate = moment(checkCoupon.expireDate).format(fmt);
    console.log(now, " " + dbDate);
    if (moment(now).isBefore(dbDate)) {
      userCart = await Cart.findById(userCart._id);
    //  console.log(userCart.user);
      //checking if user has used this coupon on cart before
      const cartUser = await User.findOne({_id:userCart.user});
      //console.log(cartUser)
      if (cartUser.usedCoupons.includes(coupon)) {
        //then coupon //is used by user
        req.flash(
          "error_msg",
          "You have already used this coupon code on cart,Please use another"
        );
        res.redirect(req.headers.referer);
      } else {
        
        cartUser.usedCoupons.push(coupon)
        await cartUser.save();
        userCart.totalCost -= checkCoupon.worth;
        let newCartCost = await userCart.save();
        req.flash(
          "success_msg",
          "You have successfully applied coupon,proceed to checkout......."
        );
        res.redirect(req.headers.referer);


      }

    } else {
      //console.log("dont");
      req.flash(
        "error_msg",
        "This coupon is expired!"
      );
      res.redirect(req.headers.referer);
    }
  }else{
    //the person wants to steal!
    req.flash(
      "error_msg",
      "That isnt a coupon!"
    );
    res.redirect(req.headers.referer);
  }
});

//deleting a product in cart
router.put("/reduce/:id", async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findById(req.params.id);
  let cart = await Cart.findOne({ user: "60917877b505fe08d4664a89" });
  const itemIndex = cart.items.findIndex((p) => p.productId == productId);
  if (itemIndex > -1) {
    cart.totalCost -= cart.items[itemIndex].price;
    cart.totalQty -= cart.items[itemIndex].qty;

    //removing the index of that product from the cartn array using id(generated by mongoose)
    await cart.items.remove({ _id: cart.items[itemIndex]._id });

    const updateCart = await cart.save();

    res.redirect(req.headers.referer);
  }
  //if there is nothing in cart,cart is deleted
  if (cart.totalQty <= 0) {
    await Cart.findByIdAndRemove(cart._id);
    res.redirect(req.headers.referer);
  }
});
//when a user clicks on add to cart for each item
router.post("/add-to-cart/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    let user_cart;
    let cart;
    //user_cart = await Cart.findOne({ user: req.user._id });
    user_cart = await Cart.findOne({ user: "60917877b505fe08d4664a89" });
    if (!user_cart) {
      cart = new Cart({});
      //if user has no cart in db
    } else {
      cart = user_cart;
      // if user has a cart,I wil dynamically access the cart and manipulate it
    }
    const product = await Product.findById(req.params.id);
    const itemIndex = cart.items.findIndex((p) => p.productId == productId);
    // console.log(itemIndex)
    if (itemIndex > -1) {
      // if product exists in the cart, update the quantity
      cart.items[itemIndex].qty += parseInt(req.body.qty);
      //remove old price of this item from total cost
      cart.totalCost -= cart.items[itemIndex].price;
      cart.items[itemIndex].price = cart.items[itemIndex].qty * product.price;
      cart.totalQty += parseInt(req.body.qty);
      cart.totalCost += cart.items[itemIndex].price;
    } else {
      // if product does not exists in cart, find it in the db to retrieve its price and add new item

      const singlePrice = parseInt(req.body.qty) * product.price;
      // console.log(singlePrice)
      cart.items.push({
        productId: productId,
        qty: parseInt(req.body.qty),
        price: singlePrice,
        title: product.name,
      });
      cart.totalQty += parseInt(req.body.qty);
      cart.totalCost += singlePrice;
    }
    //   cart.user = req.user._id;
    cart.user = "60917877b505fe08d4664a89";
    await cart.save();

    //   console.log(cart)
    req.flash("success_msg", `Item ${product.name} added to the shopping cart`);
    res.redirect(req.headers.referer);
  } catch (e) {
    console.log(e.message);
  }
});

router.get("/my-cart", async (req, res) => {
  const coupons = await Coupons.countDocuments();
  let userCart = await Cart.findOne({ user: "60917877b505fe08d4664a89" });
  const allCoupons = await Coupons.find({}).sort({ createdAt: -1 }).limit(2);

  if (userCart) {
    myCart = {
      id: userCart._id,
      totalQty: userCart.totalQty,
      totalCost: userCart.totalCost,
      product: [],
    };
    for (product of userCart.items) {
      const foundProduct = await Product.findById(product.productId);
      const productQty = product.qty;
      const productPrice = product.price;
      myCart.product.push({ foundProduct, productQty, productPrice });
    }
  } else {
    myCart = 0;
  }
  res.render("home/cart", { allCoupons, myCart, coupons });
  // res.send(myCart)
});

router.get("/", async (req, res) => {
  try {
    const allCoupons = await Coupons.find({}).sort({ createdAt: -1 }).limit(2);
    //I want to show only latest 2 to landing page

    const categories = await Category.find({}).sort({ name: 1 });
    const coupons = await Coupons.countDocuments();

    //gettin featured products(latest to last)
    const products = await Product.find({ isFeatured: true }).sort({
      createdAt: -1,
    });
    // .limit(5);
    console.log(allCoupons);

    res.render("home/home", {
      categories,
      products,
      coupons,
      allCoupons,
    });
  } catch (e) {
    console.log(e.message);
  }
});

//when a user visits a category by its slug
router.get("/:slug", async (req, res) => {
  try {
    const foundCategory = await Category.findOne({ slug: req.params.slug });
    //   const allProducts = await Product.find({ category: foundCategory._id });
    //   res.send(allProducts);
  } catch (e) {
    console.log(e.message);
  }
});

//getting a product
router.get("/:slug/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    //gettin featured products(latest to last)
    const products = await Product.find({ isFeatured: true }).sort({
      createdAt: -1,
    });
    // .limit(5);
    let cartCount;
    const userItemCart = await Cart.find({ user: "60917877b505fe08d4664a89" });
    if (userItemCart[0]) {
      cartCount = userItemCart[0].totalQty;
    } else {
      cartCount = 0;
    }

    res.render("home/product-single", {
      products,
      product,
      cartCount,
    });
  } catch (e) {
    console.log(e.message);
  }
});

module.exports = router;
