import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrimeirapgPage } from './primeirapg.page';

describe('PrimeirapgPage', () => {
  let component: PrimeirapgPage;
  let fixture: ComponentFixture<PrimeirapgPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimeirapgPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
