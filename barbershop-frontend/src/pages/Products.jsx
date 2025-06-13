import React, { useEffect, useState } from "react";
import API from "../api";
import "./products.css";
import Papa from "papaparse";
import productExampleCsv from "../assets/products_example.csv";
import categoryExampleCsv from "../assets/categories_example.csv";

function Products() {
  const user = JSON.parse(localStorage.getItem("user"));
  const businessId = user?.user?.id || user?.id;
  const isAdmin = user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState({
    name: "",
    unit: "",
    price_per_unit: "",
    category: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [csvType, setCsvType] = useState("products");
  const [showCsvModal, setShowCsvModal] = useState(false);

  const [inventoryEnabled, setInventoryEnabled] = useState(false);
  const [inventory, setInventory] = useState({});


  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchInventoryStatus(); 
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get(`/auth/products/${businessId}`);
      setProducts(res.data.products); // must match backend response shape
    } catch (err) {
      console.error(
        "❌ Error fetching products:",
        err.response?.data || err.message
      );
      alert("Error loading products.");
    }
  };

  const fetchCategories = async () => {
    const res = await API.get(`/auth/categories/${businessId}`);
    // setCategories(res.data);
    setCategories(res.data.categories);
  };

  const fetchInventory = async () => {
    try {
      const res = await API.get(`/auth/inventory/${businessId}`);
      const inventoryMap = {};
      res.data.inventory.forEach((item) => {
        inventoryMap[item.product] = item.quantity_in_stock;
      });
      setInventory(inventoryMap);
    } catch (err) {
      console.error("Error fetching inventory:", err.message);
    }
  };

  const syncInventory = async () => {
    try {
      const productIds = products.map(p => p._id);
      const res = await API.post(`/auth/inventory/sync`, {
        businessId,
        productIds,
        defaultQuantity: 1,
      });

      const inventoryMap = {};
      res.data.inventory.forEach((item) => {
        inventoryMap[item.product] = item.quantity_in_stock;
      });

      setInventory(inventoryMap);
    } catch (err) {
      console.error("Error syncing inventory:", err.message);
    }
  };

const fetchInventoryStatus = async () => {
  try {
    const res = await API.get(`/auth/inventory/status/${businessId}`);
    setInventoryEnabled(res.data.inventoryEnabled);
  } catch (err) {
    console.error("Error fetching inventory status:", err.message);
  }
};

const toggleInventoryStatus = async () => {
  try {
    const newStatus = !inventoryEnabled;
    await API.put(`/auth/inventory/status/${businessId}`, {
      inventoryEnabled: newStatus
    });
    setInventoryEnabled(newStatus);
  } catch (err) {
    alert("Error toggling inventory status: " + err.message);
  }
};




  useEffect(() => {
    const fetchAndSync = async () => {
      await fetchProducts();
      await syncInventory(); // already sets inventory
    };

    if (inventoryEnabled) {
      fetchAndSync();
    }
  }, [inventoryEnabled]);


  const handleCsvUpload = async (e) => {
    e.preventDefault();

    if (!e.target.files || e.target.files.length === 0) {
      alert("No file selected. Please select a CSV file.");
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", csvType); // send type to backend to differentiate

    try {
      const endpoint =
        csvType === "products"
          ? "/auth/uploadProductsCsv"
          : "/auth/uploadCategoriesCsv";
      await API.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("CSV uploaded successfully!");
      fetchProducts();
      fetchCategories();
      setShowCsvModal(false);
    } catch (err) {
      console.error("Error uploading CSV:", err);
      alert(err.response?.data?.error || "Error uploading CSV.");
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...productForm, business_id: businessId }; // renamed to match backend

    try {
      if (editingProductId) {
        await API.put(`/auth/products/${editingProductId}`, payload);
      } else {
        await API.post("/auth/products", payload);
      }

      fetchProducts();
      setShowProductModal(false);
      setProductForm({ name: "", unit: "", price_per_unit: "", category: "" });
      setEditingProductId(null);
    } catch (err) {
      console.error(
        "❌ Error saving product:",
        err.response?.data || err.message
      );
      alert(
        "Error: " + (err.response?.data?.error || "Failed to save product.")
      );
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    const payload = { ...categoryForm, business_id: businessId };

    try {
      if (editingCategoryId) {
        await API.put(`/auth/categories/${editingCategoryId}`, payload);
      } else {
        await API.post("/auth/categories", payload);
      }

      fetchCategories();
      setShowCategoryModal(false);
      setCategoryForm({ name: "", description: "" });
      setEditingCategoryId(null);
    } catch (err) {
      console.error(
        "❌ Error submitting category:",
        err.response?.data || err.message
      );
      alert(
        "Error: " + (err.response?.data?.error || "Failed to save category.")
      );
    }
  };

  const handleEditProduct = (product) => {
    setProductForm({
      name: product.name,
      unit: product.unit,
      price_per_unit: product.price_per_unit,
      category: product.category?._id,
    });
    setEditingProductId(product._id);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Delete this product?")) {
      await API.delete(`/auth/products/${id}`);
      fetchProducts();
    }
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description,
    });
    setEditingCategoryId(category._id);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Delete this category?")) {
      await API.delete(`/auth/categories/${id}`);
      fetchCategories();
    }
  };

  const updateQuantity = async (productId, delta) => {
    const newQuantity = (inventory[productId] || 0) + delta;
    if (newQuantity < 0) return;

    try {
      await API.put(`/auth/inventory`, {
        businessId,
        productId,
        quantity: newQuantity,
      });

      setInventory((prev) => ({
        ...prev,
        [productId]: newQuantity,
      }));
    } catch (err) {
      alert("Error updating quantity: " + (err.response?.data?.error || err.message));
    }
  };


  return (
    <div className="products-container">
      <div className="products-header">
        <h2>All Products </h2>
        {isAdmin && (
          <div>
            <button onClick={toggleInventoryStatus}>
  {inventoryEnabled ? "Disable" : "Enable"} Inventory Management
</button>


            <button onClick={() => setShowProductModal(true)}>
              + Add Product
            </button>
            <button onClick={() => setShowCategoryModal(true)}>
              + Add Category
            </button>
            <button
              onClick={() => {
                setCsvType("products");
                setShowCsvModal(true);
              }}
            >
              Upload Products CSV

            </button>
            <button
              onClick={() => {
                setCsvType("categories");
                setShowCsvModal(true);
              }}
            >
              Upload Categories CSV
            </button>
          </div>
        )}
      </div>

      <h3>Product List</h3>
      <table className="products-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Unit</th>
            <th>Price / Unit</th>
            <th>Category</th>
            {isAdmin && <th>Actions</th>}
            {inventoryEnabled && <th>Quantity</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((prod) => (
            <tr key={prod._id}>
              <td>{prod.name}</td>
              <td>{prod.unit}</td>
              <td>${prod.price_per_unit}</td>
              <td>{prod.category?.name}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => handleEditProduct(prod)}>Edit</button>
                  <button onClick={() => handleDeleteProduct(prod._id)}>
                    Delete
                  </button>
                </td>


              )}
              {inventoryEnabled && (
                <td>
                  <>
                    <button onClick={() => updateQuantity(prod._id, -1)}>-</button>
                    <span style={{ margin: "0 8px" }}>{inventory[prod._id] || 0}</span>
                    <button onClick={() => updateQuantity(prod._id, 1)}>+</button>
                  </>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Categories</h3>
      <table className="products-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat._id}>
              <td>{cat.name}</td>
              <td>{cat.description}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => handleEditCategory(cat)}>Edit</button>
                  <button onClick={() => handleDeleteCategory(cat._id)}>
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingProductId ? "Edit Product" : "Add New Product"}</h3>

            <form onSubmit={handleProductSubmit}>
              <label>Name</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                required
              />

              <label>Unit</label>
              <input
                type="text"
                value={productForm.unit}
                onChange={(e) =>
                  setProductForm({ ...productForm, unit: e.target.value })
                }
                required
              />

              <label>Price per Unit</label>
              <input
                type="number"
                step="0.01"
                value={productForm.price_per_unit}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    price_per_unit: e.target.value,
                  })
                }
                required
              />

              <label>Category</label>
              <select
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value })
                }
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option value={cat._id} key={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="modal-actions">
                <button type="submit">Save</button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingCategoryId ? "Edit Category" : "Add New Category"}</h3>
            <form onSubmit={handleCategorySubmit}>
              <label>Name</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                required
              />

              <label>Description</label>
              <input
                type="text"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
              />

              <div className="modal-actions">
                <button type="submit">Save</button>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCsvModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              Upload {csvType === "products" ? "Products" : "Categories"} CSV
            </h3>
            <sub>Your Business ID is {businessId}</sub>
            <form>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={async () => {
                    if (!csvFile) return alert("Please select a CSV file.");

                    const formData = new FormData();
                    formData.append("file", csvFile);
                    formData.append("type", csvType);
                    formData.append("business_id", businessId);

                    try {
                      await API.post("/auth/uploadCsv", formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                      alert("Upload successful!");
                      fetchProducts();
                      fetchCategories();
                      setShowCsvModal(false);
                    } catch (err) {
                      alert(
                        "Upload failed: " +
                        (err.response?.data?.error || err.message)
                      );
                    }
                  }}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
            <a
              href={
                csvType === "products" ? productExampleCsv : categoryExampleCsv
              }
              download
            >
              Download Example CSV
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
