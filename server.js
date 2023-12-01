const express = require("express");
const pool = require("./db");
const path = require("path");
const flash = require("express-flash");
const session = require("express-session");
const passport = require("passport");
const routes = require("./src/routes")

const initializePassport = require("./passportConfig");
const app = express();

initializePassport(passport);
const port = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "views", "styles")));

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie : { secure : false }
    })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


app.get("/users", (req, res) =>{
    pool.query("SELECT * FROM usuarios", (error, results) =>{
        if(error) throw error;
        res.status(200).json(results.rows);
    });
});


app.use("/", routes);
app.use("/users/login", routes, checkAuthenticated);
app.use("/users/register", routes, checkAuthenticated);
app.use("/users/dashboard", routes, checkNotAuthenticated); 
app.use("/users/update-profile", routes, checkAuthenticated);
app.use("/product/update/:id", routes, checkAuthenticated);
app.use("/update-product/:id", routes, checkAuthenticated);
app.use("/update-category/:id", routes, checkAuthenticated);
app.use("/category/update/:id", routes, checkAuthenticated);
app.use("/product/create", routes, checkAuthenticated);
app.use("/category/create", routes, checkAuthenticated);
app.use("/create-product", routes, checkAuthenticated);
app.use("/create-category", routes, checkAuthenticated);
app.use("/delete-category/:id", routes, checkAuthenticated);
app.use("/delete-product/:id", routes, checkAuthenticated);
app.use("/users/logout", routes);
app.use("/add_cart", checkAuthenticated, routes);
app.use("/checkout", routes, checkAuthenticated);
app.use("/users/purchases", routes, checkAuthenticated);
app.use("/delete_purchase/:id", routes, checkAuthenticated);

app.use("/users/register", routes);
app.use("/users/editProfile", checkAuthenticated, routes);
app.use("/users/deleteAccount", checkAuthenticated, routes);



app.post("/users/login", passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
}));

app.get('/remove_item', (request, response) => {
  const id = request.query.id;

  for (let i = 0; i < request.session.cart.length; i++) {
    if (request.session.cart[i].id === id) {
      request.session.cart.splice(i, 1);
      break; 
    }
  }

  response.redirect("/");
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/users/dashboard");
    }
    next();
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/users/login");
  }

app.listen(port, () => console.log(`ouvindo na porta ${port}`));