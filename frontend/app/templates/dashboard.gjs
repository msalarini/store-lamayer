import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { on } from '@ember/modifier';

export default class DashboardRoute extends Component {
  @service session;
  @service router;

  @tracked products = [];
  @tracked loading = true;
  @tracked error = null;

  // Form state
  @tracked newName = '';
  @tracked newQuantity = 0;
  @tracked newBuyPrice = 0;
  @tracked newSellPrice = 0;

  constructor() {
    super(...arguments);
    if (!this.session.isAuthenticated) {
      this.router.transitionTo('login');
      return;
    }
    this.fetchProducts();
  }

  async fetchProducts() {
    this.loading = true;
    try {
      const response = await fetch('http://localhost:3000/api/products', {
        headers: {
          'x-user-email': this.session.currentUserEmail
        }
      });
      if (response.ok) {
        this.products = await response.json();
      } else {
        this.error = 'Failed to load products';
      }
    } catch (e) {
      this.error = 'Network error';
    } finally {
      this.loading = false;
    }
  }

  @action
  updateField(field, event) {
    this[field] = event.target.value;
  }

  @action
  async addProduct(event) {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': this.session.currentUserEmail
        },
        body: JSON.stringify({
          name: this.newName,
          quantity: this.newQuantity,
          buyPrice: this.newBuyPrice,
          sellPrice: this.newSellPrice
        })
      });

      if (response.ok) {
        // Reset form
        this.newName = '';
        this.newQuantity = 0;
        this.newBuyPrice = 0;
        this.newSellPrice = 0;
        // Refresh list
        await this.fetchProducts();
      } else {
        alert('Failed to add product');
      }
    } catch (e) {
      alert('Error adding product');
    }
  }

  @action
  async deleteProduct(id) {
    if (!confirm('Are you sure?')) return;
    try {
      const response = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': this.session.currentUserEmail
        }
      });
      if (response.ok) {
        await this.fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (e) {
      alert('Error deleting product');
    }
  }

  <template>
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard - Inventory</h1>
        <div>
          <span class="me-3">User: {{this.session.currentUserEmail}}</span>
          <button class="btn btn-outline-danger" type="button" {{on "click" this.session.logout}}>Logout</button>
        </div>
      </div>

      {{#if this.error}}
        <div class="alert alert-danger">{{this.error}}</div>
      {{/if}}

      <div class="card mb-4">
        <div class="card-header">Add New Product</div>
        <div class="card-body">
          <form {{on "submit" this.addProduct}} class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Name</label>
              <input type="text" class="form-control" value={{this.newName}} {{on "input" (fn this.updateField "newName")}} required />
            </div>
            <div class="col-md-2">
              <label class="form-label">Quantity</label>
              <input type="number" class="form-control" value={{this.newQuantity}} {{on "input" (fn this.updateField "newQuantity")}} required />
            </div>
            <div class="col-md-2">
              <label class="form-label">Buy Price</label>
              <input type="number" step="0.01" class="form-control" value={{this.newBuyPrice}} {{on "input" (fn this.updateField "newBuyPrice")}} required />
            </div>
            <div class="col-md-2">
              <label class="form-label">Sell Price</label>
              <input type="number" step="0.01" class="form-control" value={{this.newSellPrice}} {{on "input" (fn this.updateField "newSellPrice")}} required />
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button type="submit" class="btn btn-success w-100">Add</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Product List</div>
        <div class="card-body">
          {{#if this.loading}}
            <p>Loading...</p>
          {{else}}
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {{#each this.products as |product|}}
                  <tr>
                    <td>{{product.name}}</td>
                    <td>{{product.quantity}}</td>
                    <td>{{product.buyPrice}}</td>
                    <td>{{product.sellPrice}}</td>
                    <td>
                      <button class="btn btn-sm btn-danger" type="button" {{on "click" (fn this.deleteProduct product.id)}}>Delete</button>
                    </td>
                  </tr>
                {{/each}}
              </tbody>
            </table>
          {{/if}}
        </div>
      </div>
    </div>
  </template>
}
