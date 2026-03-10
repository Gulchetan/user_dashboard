import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([
  { id: '1', name: 'Amit Sharma', email: 'amit.test@gmail.com', role: 'Admin' },
  { id: '2', name: 'Priya Verma', email: 'priya.test@gmail.com', role: 'Editor' },
  { id: '3', name: 'Rahul Gupta', email: 'rahul.test@company.com', role: 'Viewer' },
  { id: '4', name: 'Sneha Patel', email: 'sneha.test@gmail.com', role: 'Editor' },
  { id: '5', name: 'Gulchetan Singh', email: 'gulchetansingh2002@gmail.com', role: 'Viewer' }
]);

  users$: Observable<User[]> = this.usersSubject.asObservable();

  addUser(user: Omit<User, 'id'>): void {
    const newUser: User = {
      ...user,
      id: Date.now().toString()
    };
    const currentUsers = this.usersSubject.value;
    this.usersSubject.next([...currentUsers, newUser]);
  }

  getUsers(): User[] {
    return this.usersSubject.value;
  }
}
