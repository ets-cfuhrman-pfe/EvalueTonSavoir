import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BarChartIcon from '@mui/icons-material/BarChart';
import ImageIcon from '@mui/icons-material/Image';
import PeopleIcon from '@mui/icons-material/People';

const styles = {
  drawerBg: 'rgba(82, 113, 255, 0.85)',
  drawerTxtColor: 'white',
  btnBg: 'rgba(82, 113, 255, 1)',
  btnHover: 'rgba(65, 105, 225, 0.7)',
  height: '100%'
};

export default function AdminDrawer() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (isOpen: boolean) => () => {
    setOpen(isOpen);
  };

  const menuItems = [
    { text: 'Stats', icon: <BarChartIcon /> },
    { text: 'Images', icon: <ImageIcon /> },
    { text: 'Users', icon: <PeopleIcon /> },
  ];

  const list = (
    <Box sx={{ width: 250, backgroundColor: styles.drawerBg, height: styles.height, color: styles.drawerTxtColor }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        {menuItems.map(({ text, icon }) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon sx={{ color: styles.drawerTxtColor }}>{icon}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <div>
      <Button 
        variant="contained" 
        sx={{ backgroundColor: styles.btnBg, color: 'white', '&:hover': { backgroundColor: styles.btnHover } }} 
        onClick={toggleDrawer(true)}
      >
        Admin
      </Button>
      <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
        {list}
      </Drawer>
    </div>
  );
}
