import { Box, Container, Link as MuiLink, Stack, Typography } from '@mui/material'
import { APP_NAME } from '@/utils/constants'

export function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 4, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <MuiLink href="#" variant="body2" color="text.secondary" underline="hover">
              Privacy
            </MuiLink>
            <MuiLink href="#" variant="body2" color="text.secondary" underline="hover">
              Terms
            </MuiLink>
            <MuiLink href="#" variant="body2" color="text.secondary" underline="hover">
              Support
            </MuiLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
