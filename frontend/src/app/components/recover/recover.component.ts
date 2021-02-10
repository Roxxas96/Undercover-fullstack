import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-recover',
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss'],
})
export class RecoverComponent implements OnInit {
  errorMessage = {
    email: '',
    other: '',
  };

  loading = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  onRecover(form: NgForm) {
    this.loading = true;
    const email = form.value['email'];
    this.authService.recoverPassword(email).then().catch();
  }
}
