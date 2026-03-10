import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent {
  @Output() userSubmitted = new EventEmitter<Omit<User, 'id'>>();
  @Output() closeModal = new EventEmitter<void>();

  userForm: FormGroup;
  roles = ['Admin', 'Editor', 'Viewer'];

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.userSubmitted.emit(this.userForm.value);
      this.userForm.reset();
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
