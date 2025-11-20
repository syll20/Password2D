import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Password2DGridComponent } from '../password2d-grid.component';

@Component({
    selector: 'app-test-host',
    standalone: true,
    imports: [Password2DGridComponent],
    template: `
    <password2d-grid
      [options]="{ rows: 2, cols: 8 }"
      (passwordChange)="onPasswordChange($event)"
    ></password2d-grid>
    <password2d-grid
      [options]="{ rows: 2, cols: 8 }"
      (passwordChange)="onPasswordConfirmChange($event)"
    ></password2d-grid>
  `
})
class TestHostComponent {
    password: string = '';
    passwordConfirm: string = '';
    onPasswordChange(p: string) { this.password = p; }
    onPasswordConfirmChange(p: string) { this.passwordConfirm = p; }
}

describe('Angular Demo Issues Reproduction', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(TestHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should not duplicate characters between two grids', () => {
        const grids = fixture.debugElement.queryAll(By.directive(Password2DGridComponent));
        const firstCell = grids[0].query(By.css('.border'));
        const event = new KeyboardEvent('keydown', { key: 'a' });
        firstCell.triggerEventHandler('keydown', event);
        fixture.detectChanges();
        // second grid should remain empty
        const secondGridCells = grids[1].queryAll(By.css('.border'));
        const anyFilled = secondGridCells.some(c => c.nativeElement.textContent.trim() !== '');
        expect(anyFilled).toBeFalsy();
    });

    it('should preserve focus after toggling mask', () => {
        const grids = fixture.debugElement.queryAll(By.directive(Password2DGridComponent));
        const firstGrid = grids[0];
        const firstCell = firstGrid.query(By.css('.border'));
        firstCell.nativeElement.focus();
        const toggleBtn = firstGrid.query(By.css('button.text-cyan-600'));
        toggleBtn.nativeElement.click();
        fixture.detectChanges();
        expect(document.activeElement).toBe(firstCell.nativeElement);
    });
});
