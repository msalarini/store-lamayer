import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { on } from '@ember/modifier';

export default class LoginRoute extends Component {
  @service session;
  @service router;

  @tracked email = '';
  @tracked error = '';

  @action
  updateEmail(event) {
    this.email = event.target.value;
  }

  @action
  async login(event) {
    event.preventDefault();
    try {
      // For this prototype, we just validate the email against the allowed list client-side
      // or we could hit an endpoint. The backend also validates it.
      const allowed = ['marcussalarini@gmail.com', 'llamayer@hotmail.com'];
      
      if (allowed.includes(this.email)) {
        this.session.login(this.email);
        this.router.transitionTo('dashboard');
      } else {
        this.error = 'Email not authorized.';
      }
    } catch (e) {
      this.error = 'Login failed.';
    }
  }

  <template>
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">Login - Store Lamayer</div>
            <div class="card-body">
              {{#if this.error}}
                <div class="alert alert-danger">{{this.error}}</div>
              {{/if}}
              <form {{on "submit" this.login}}>
                <div class="mb-3">
                  <label for="email" class="form-label">Email address</label>
                  <input 
                    type="email" 
                    class="form-control" 
                    id="email" 
                    value={{this.email}} 
                    {{on "input" this.updateEmail}}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
}
