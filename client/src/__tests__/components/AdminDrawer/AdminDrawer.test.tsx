import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDrawer from '../../../components/AdminDrawer/AdminDrawer';
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router
import '@testing-library/jest-dom';

describe('AdminDrawer Component', () => {
  test('renders the Admin button', () => {
    render(
      <Router>
        <AdminDrawer />
      </Router>
    );
    
    // Check if the "Admin" button is in the document
    const button = screen.getByRole('button', { name: /admin/i });
    expect(button).toBeInTheDocument();
  });

  test('opens the drawer when the button is clicked', () => {
    render(
      <Router>
        <AdminDrawer />
      </Router>
    );
    
    // Click the "Admin" button
    const button = screen.getByRole('button', { name: /admin/i });
    fireEvent.click(button);

    // Check if the drawer is open (it should be a right-side drawer, so check for list items)
    const statsItem = screen.getByText(/Stats/i);
    expect(statsItem).toBeInTheDocument();
  });
  //TODO modify this test as no redirect as of yet
/*
  test('closes the drawer when an item is clicked', () => {
    render(<AdminDrawer />);
    
    // Open the drawer by clicking the "Admin" button
    const button = screen.getByRole('button', { name: /admin/i });
    fireEvent.click(button);

    // Click on a menu item (Stats, Images, or Users)
    const statsItem = screen.getByText(/Stats/i);
    expect(statsItem).toBeInTheDocument();
    fireEvent.click(statsItem);

    // Ensure that the drawer is closed after clicking an item
    const statsItemAgain = screen.queryByText(/Stats/i);
    expect(statsItemAgain).not.toBeInTheDocument();
  });
*/
  test('menu items render correctly', () => {
    render(
      <Router>
        <AdminDrawer />
      </Router>
    );
    
    // Open the drawer
    const button = screen.getByRole('button', { name: /admin/i });
    fireEvent.click(button);

    // Check if all the menu items are rendered
    expect(screen.getByText(/Stats/i)).toBeInTheDocument();
    expect(screen.getByText(/Images/i)).toBeInTheDocument();
    expect(screen.getByText(/Users/i)).toBeInTheDocument();
  });
});
