const pool = require("../db");
const bcrypt = require("bcrypt");

const getLogin = (req, res) => {
    res.render("login.ejs");
};

const getRegister = (req, res) => {
    res.render("register.ejs");
};

const getUpdateUser = (req, res) => {
  res.render("updateUser.ejs");
};

const getPurchases = (req, res, next) => {
  pool.query(
    'SELECT venda.*, venda_produto.produto_id, venda_produto.quantidade, produtos.nome as produto_nome, produtos.preco as valor_unitario FROM venda JOIN venda_produto ON venda.id = venda_produto.venda_id JOIN produtos ON venda_produto.produto_id = produtos.id',
    (error, allPurchaseResults) => {
      if (error) {
        return next(error);
      }
      const allPurchases = allPurchaseResults.rows;
      res.render('userPurchases', { allPurchases });
    }
  );
};


const getUpdateProduct = (req, res) => {
  const productId = req.params.id; 

  pool.query(
    'SELECT * FROM produtos WHERE id = $1',
    [productId],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Erro ao buscar detalhes do produto');
      }
      
      const product = results.rows[0]; 

      res.render("updateProduct.ejs", { product }); 
    }
  );
};

const getCreateProduct = (req, res) => {
  pool.query('SELECT * FROM categorias', (error, results) => {
    if (error) {
      console.error(error);
    }

    const categories = results.rows;
    res.render("createProduct.ejs", { categories });
  });
};

const getCreateCategory = (req, res) => {
  res.render("createCategory.ejs");
};

const getCategoryToUpdate = (req, res, next) => {
  const categoryId = req.params.id;

  pool.query('SELECT * FROM categorias WHERE id = $1', [categoryId], (err, result) => {
    if (err) {
      return next(err);
    }

    const category = result.rows[0];
    res.render('categoryUpdate', { category });
  });
};

const getDashboard = (req, res, next) => {
  pool.query(
    'SELECT produtos.*, categorias.nome as categoria_nome FROM produtos JOIN categorias ON produtos.categoria_id = categorias.id',
    (err, results) => {
      if (err) {
        return next(err);
      }
      const products = results.rows;

      if (req.isAuthenticated()) {
        const userId = req.user.id;
        const isAdmin = req.user.adm;

        if (!isAdmin) {
          pool.query(
            'SELECT venda.*, venda_produto.produto_id, venda_produto.quantidade, produtos.nome as produto_nome, produtos.preco as valor_unitario FROM venda JOIN venda_produto ON venda.id = venda_produto.venda_id JOIN produtos ON venda_produto.produto_id = produtos.id WHERE venda.usuario_id = $1',
            [userId],
            (error, userPurchaseResults) => {
              if (error) {
                return next(error);
              }
              const userPurchases = userPurchaseResults.rows;
              res.render('dashboard', { user: req.user, products, userPurchases });
            }
          );
        } else {
          pool.query('SELECT * FROM categorias', (error, categoryResults) => {
            if (error) {
              return next(error);
            }
            const categories = categoryResults.rows;
            res.render('adminDashboard', { user: req.user, products, categories });
          });
        }
      } else {
        res.redirect('/users/login');
      }
    }
  );
};

const logout = (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.error(err);
            return res.redirect("/users/dashboard"); 
        }
        req.flash("success_msg", "Você deslogou com sucesso")
        res.render("login");
    });
};

const register = async (req, res) => {
    const { nome, endereco, email, login, senha, senha2, adm = false } = req.body;
  
    const errors = [];
  
    console.log({
      nome,
      endereco,
      email,
      login,
      senha,
      senha2,
    });
  
    if (!nome || !endereco || !email || !login || !senha || !senha2) {
      errors.push({ message: "Preencha todos os campos" });
    }
  
    if (senha.length < 6) {
      errors.push({ message: "Senhas precisam ter ao menos 6 caracteres" });
    }
  
    if (senha !== senha2) {
      errors.push({ message: "As senhas inseridas são diferentes" });
    }
  
    if (errors.length > 0) {
      res.render("register", { errors, nome, endereco, email, login, senha, senha2 });
    } else {
      hashedPassword = await bcrypt.hash(senha, 10);
      console.log(hashedPassword);
  
      pool.query(
        `SELECT * FROM usuarios
          WHERE email = $1`, [email],
        (err, results) => {
          if (err) {
            console.log(err);
          }
          console.log(results.rows);
  
          if (results.rows.length > 0) {
            return res.render("register", {
              message: "Email em uso"
            });
          } else {
            pool.query(
              `INSERT INTO usuarios (nome, endereco, email, login, senha, adm)
                  VALUES ($1, $2, $3, $4, $5, $6)
                  RETURNING id, senha`,
              [nome, endereco, email, login, hashedPassword, adm],
              (err, results) => {
                if (err) {
                  throw err;
                }
                console.log(results.rows);
                req.flash("success_msg", "Você está registrado, faça login");
                res.redirect("/users/login");
              }
            );
          }
        }
      );
    }
};

const getProducts = (req, res, next) => {
  pool.query(
    'SELECT produtos.*, categorias.nome as categoria_nome FROM produtos JOIN categorias ON produtos.categoria_id = categorias.id',
    (err, results) => {
      if (err) {
        return next(err);
      }

      if(!req.session.cart){
        req.session.cart = [];
      }

      const products = results.rows;

      res.render("index", { products, cart : req.session.cart, user: req.user });
    }
  );
};

const postEditProfile = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/users/login");
  }

  const { newName, newEndereco, newEmail, newSenha, confirmNewSenha } = req.body;

  const userId = req.user.id;
  const errors = [];

  if (!newName || !newEndereco || !newEmail) {
    errors.push({ message: "Preencha todos os campos obrigatórios" });
  }

  if (newSenha && newSenha.length < 6) {
    errors.push({ message: "A senha deve ter no mínimo 6 caracteres" });
  }

  if (newSenha !== confirmNewSenha) {
    errors.push({ message: "As senhas inseridas são diferentes" });
  }

  if (errors.length > 0) {
    return res.render("updateUser.ejs", { errors, newName, newEndereco, newEmail });
  }

  try {
    let hashedPassword = req.user.senha;

    if (newSenha) {
      hashedPassword = await bcrypt.hash(newSenha, 10);
    }

    await pool.query(
      `UPDATE usuarios
       SET nome = $1, endereco = $2, email = $3, senha = $4
       WHERE id = $5`,
      [newName, newEndereco, newEmail, hashedPassword, userId]
    );

    req.flash("success_msg", "Perfil atualizado com sucesso.");
    res.redirect("/users/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Erro ao atualizar o perfil.");
    res.redirect("/users/edit-profile");
  }
};

const postDeleteAccount = (req, res) => {
  const userId = req.user.id;

  pool.query(
    `DELETE FROM usuarios
     WHERE id = $1`,
    [userId],
    (error, results) => {
      if (error) {
        console.error(error);
        req.flash("error_msg", "Erro ao excluir a conta.");
        return res.redirect("/users/dashboard");
      }

      req.session.destroy((err) => {
        if (err) {
          console.error(err);
          req.flash("error_msg", "Erro ao encerrar a sessão.");
          return res.redirect("/users/dashboard");
        }
        res.redirect("/");
      });
    }
  );
};

const updateProduct = (req, res) => {
  const productId = req.params.id;
  const { nome, preco, descricao, foto, quantidade } = req.body;

  pool.query(
      `UPDATE produtos
       SET nome = $1, preco = $2, descricao = $3, foto = $4, quantidade = $5
       WHERE id = $6`,
      [nome, preco, descricao, foto, quantidade, productId],
      (error, results) => {
          if (error) {
              console.error(error);
              req.flash("error_msg", "Erro ao atualizar o produto.");
              return res.redirect("product/update/" + productId);
          }

          req.flash("success_msg", "Produto atualizado com sucesso.");
          res.redirect("/");
      }
  );
};

const deleteProduct = (req, res) => {
  const productId = req.params.id;

  pool.query(
    `DELETE FROM produtos WHERE id = $1`,
    [productId],
    (error, results) => {
      if (error) {
        console.error(error);
        req.flash("error_msg", "Erro ao excluir o produto.");
        return res.redirect("/"); 
      }

      req.flash("success_msg", "Produto excluído com sucesso.");
      res.redirect("/"); 
    }
  );
};

const createProduct = (req, res) => {
  const { nome, preco, descricao, foto, quantidade, categoria } = req.body;

  pool.query(
    `INSERT INTO produtos (nome, preco, descricao, foto, quantidade, categoria_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [nome, preco, descricao, foto, quantidade, categoria],
    (error, results) => {
      if (error) {
        console.error(error);
        req.flash("error_msg", "Erro ao criar o produto.");
        return res.redirect("/create-product");
      }

      req.flash("success_msg", "Produto criado com sucesso.");
      res.redirect("/");
    }
  );
};

const updateCategory = (req, res, next) => {
  const categoryId = req.params.id;
  const { nome } = req.body;

  pool.query('UPDATE categorias SET nome = $1 WHERE id = $2', [nome, categoryId], (err, result) => {
    if (err) {
      return next(err);
    }

    req.flash('success_msg', 'Categoria atualizada com sucesso');
    res.redirect('/users/dashboard');
  });
};

const deleteCategory = (req, res) => {
  const categoryId = req.params.id; 
  pool.query(
    'DELETE FROM categorias WHERE id = $1',
    [categoryId],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Erro ao excluir a categoria');
      }
      
      req.flash('success_msg', 'Categoria excluída com sucesso');
      res.redirect('/users/dashboard');
    }
  );
};

const createCategory = (req, res) => {
  const { nome } = req.body; 

  if (!nome) {
    return res.status(400).send('Nome da categoria é obrigatório');
  }
  pool.query(
    'INSERT INTO categorias (nome) VALUES ($1)',
    [nome],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Erro ao criar uma nova categoria');
      }

      req.flash('success_msg', 'Nova categoria criada com sucesso');
      res.redirect('/users/dashboard');
    }
  );
};

const addCart = (req, res) => {
  const id = req.body.id;
	const nome = req.body.nome;
	const preco = req.body.preco;
	let count = 0;

	for(let i = 0; i < req.session.cart.length; i++){
		if(req.session.cart[i].id === id){
			req.session.cart[i].quantidade += 1;
			count++;
		}
	}

	if(count === 0){
		const cart_data = {
			id : id,
			nome : nome,
			preco : parseFloat(preco),
			quantidade : 1
		};

		req.session.cart.push(cart_data);
	}

	res.redirect("/");
};

const checkout = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/users/login");
    }
    const userId = req.user.id;
    await pool.query('BEGIN');

    const newSale = await pool.query(
      `INSERT INTO venda (data, usuario_id)
      VALUES (CURRENT_TIMESTAMP, $1)
      RETURNING id`,
      [userId]
    );

    const saleId = newSale.rows[0].id;
    for (const item of req.session.cart) {
      await pool.query(
        `INSERT INTO venda_produto (venda_id, produto_id, quantidade)
        VALUES ($1, $2, $3)`,
        [saleId, item.id, item.quantidade]
      );

      await pool.query(
        `UPDATE produtos
        SET quantidade = quantidade - $1
        WHERE id = $2`,
        [item.quantidade, item.id]
      );
    }

    await pool.query('COMMIT');
    req.session.cart = [];

    res.redirect("/get_user_purchases");
  } catch (error) {
    await pool.query('ROLLBACK');

    console.error(error);
    req.flash("error_msg", "Erro ao processar o checkout.");
    res.redirect("/");
  }
};

const deletePurchases = (req, res) => {
  const vendaId = req.params.id;

  pool.query('DELETE FROM venda_produto WHERE venda_id = $1', [vendaId], (error) => {
    if (error) {
      console.error('Erro ao deletar registros relacionados na venda_produto:', error);
      res.status(500).send('Erro ao deletar registros relacionados na venda_produto');
    } else {
      pool.query('DELETE FROM venda WHERE id = $1', [vendaId], (err, result) => {
        if (err) {
          console.error('Erro ao deletar venda:', err);
          res.status(500).send('Erro ao deletar venda');
        } else {
          console.log('Venda deletada com sucesso');
          res.redirect('/users/purchases');
        }
      });
    }
  });
};


module.exports = {
  getLogin,
  getRegister,
  getDashboard,
  getUpdateUser,
  getUpdateProduct,
  getCreateProduct,
  logout,
  register,
  postDeleteAccount,
  postEditProfile,
  getProducts,
  updateProduct,
  deleteProduct,
  createProduct,
  getCategoryToUpdate,
  updateCategory,
  deleteCategory,
  getCreateCategory,
  createCategory,
  addCart,
  checkout,
  getPurchases,
  deletePurchases,
};