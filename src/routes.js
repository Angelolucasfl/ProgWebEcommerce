const { Router } = require("express");
const controller = require("./controller");

const router = Router();

router.get("/", controller.getProducts);
router.get("/users/login", controller.getLogin);
router.get("/users/register", controller.getRegister);
router.get("/users/dashboard", controller.getDashboard);
router.get("/users/update-profile", controller.getUpdateUser);
router.get("/product/update/:id", controller.getUpdateProduct);
router.get("/category/update/:id", controller.getCategoryToUpdate);
router.get("/users/logout", controller.logout);
router.get("/category/create", controller.getCreateCategory);
router.get("/product/create", controller.getCreateProduct);
router.get("/users/purchases", controller.getPurchases);

router.post("/add_cart", controller.addCart);
router.post("/checkout", controller.checkout);
router.post("/delete_purchase/:id", controller.deletePurchases);

router.post("/create-product", controller.createProduct);
router.post("/create-category", controller.createCategory);
router.post("/update-category/:id", controller.updateCategory);
router.post("/update-product/:id", controller.updateProduct);
router.post("/delete-product/:id", controller.deleteProduct);
router.post("/delete-category/:id", controller.deleteCategory);
router.post("/users/deleteAccount", controller.postDeleteAccount);
router.post("/users/register", controller.register);
router.post("/users/editProfile", controller.postEditProfile);

module.exports = router;