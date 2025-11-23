import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class SessionService extends Service {
    @tracked currentUserEmail = null;

    constructor() {
        super(...arguments);
        this.loadSession();
    }

    login(email) {
        this.currentUserEmail = email;
        localStorage.setItem('userEmail', email);
    }

    logout() {
        this.currentUserEmail = null;
        localStorage.removeItem('userEmail');
    }

    loadSession() {
        const email = localStorage.getItem('userEmail');
        if (email) {
            this.currentUserEmail = email;
        }
    }

    get isAuthenticated() {
        return !!this.currentUserEmail;
    }
}
