package com.bellafrodita.TiendaBellaAfrodita.security;

import com.bellafrodita.TiendaBellaAfrodita.usuario.Usuario;
import com.bellafrodita.TiendaBellaAfrodita.usuario.UsuarioRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));

        if (!usuario.isActivo()) {
            throw new UsernameNotFoundException("La cuenta del usuario se encuentra inactiva");
        }

        List<GrantedAuthority> authorities = new ArrayList<>();
        String rol = usuario.getRol();
        if (rol != null && !rol.startsWith("ROLE_")) {
            rol = "ROLE_" + rol;
        }
        authorities.add(new SimpleGrantedAuthority(rol != null ? rol : "ROLE_CLIENTE"));

        return new User(
                usuario.getEmail(),
                usuario.getPassword(),
                usuario.isActivo(),
                true,
                true,
                true,
                authorities
        );
    }
}
