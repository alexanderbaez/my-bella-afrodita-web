package com.bellafrodita.TiendaBellaAfrodita;

import com.bellafrodita.TiendaBellaAfrodita.usuario.model.Usuario;
import com.bellafrodita.TiendaBellaAfrodita.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@SpringBootTest
public class AdminAuthMasterIntegrationTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Test
    @DisplayName("Debe verificar que lopezandre26@gmail.com es el único administrador maestro con clave 123456789")
    public void testCredencialesMaestrasAdmin() {
        // 1. Verificar que el admin anterior (admin@bellafrodita.com) no existe en la BD
        Optional<Usuario> adminViejo = usuarioRepository.findByEmail("admin@bellafrodita.com");
        Assertions.assertTrue(adminViejo.isEmpty(), "admin@bellafrodita.com debe ser eliminado de la base de datos");

        // 2. Verificar que existe el nuevo administrador maestro
        Optional<Usuario> adminMasterOpt = usuarioRepository.findByEmail("lopezandre26@gmail.com");
        Assertions.assertTrue(adminMasterOpt.isPresent(), "lopezandre26@gmail.com debe existir en la base de datos");

        Usuario adminMaster = adminMasterOpt.get();
        Assertions.assertEquals("ROLE_ADMIN", adminMaster.getRol(), "El rol debe ser ROLE_ADMIN");
        Assertions.assertTrue(adminMaster.isActivo(), "El usuario administrador debe estar activo");

        // 3. Verificar que la contraseña encriptada coincide con '123456789'
        Assertions.assertTrue(passwordEncoder.matches("123456789", adminMaster.getPassword()),
                "La contraseña cifrada con BCrypt debe coincidir con '123456789'");

        // 4. Probar autenticación exitosa mediante AuthenticationManager
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken("lopezandre26@gmail.com", "123456789")
        );
        Assertions.assertNotNull(auth);
        Assertions.assertTrue(auth.isAuthenticated());

        // 5. Probar que contraseña incorrecta rechaza el acceso
        Assertions.assertThrows(BadCredentialsException.class, () -> {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken("lopezandre26@gmail.com", "clave_invalida")
            );
        });
    }
}
