package com.planejamais.controller;

import com.planejamais.model.Usuario;
import com.planejamais.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/perfil")
    public ResponseEntity<?> getPerfil(@AuthenticationPrincipal UserDetails userDetails) {
        return usuarioRepository.findByEmail(userDetails.getUsername())
                .map(u -> ResponseEntity.ok(Map.of(
                        "id", u.getId(),
                        "nome", u.getNome(),
                        "email", u.getEmail()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/perfil")
    public ResponseEntity<?> atualizarPerfil(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body
    ) {
        return usuarioRepository.findByEmail(userDetails.getUsername())
                .map(u -> {
                    String nome = body.get("nome");
                    String email = body.get("email");
                    if (nome != null && !nome.isBlank()) u.setNome(nome.trim());
                    if (email != null && !email.isBlank()) u.setEmail(email.trim());
                    usuarioRepository.save(u);
                    return ResponseEntity.ok(Map.of(
                            "id", u.getId(),
                            "nome", u.getNome(),
                            "email", u.getEmail()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/perfil")
    public ResponseEntity<?> excluirConta(@AuthenticationPrincipal UserDetails userDetails) {
        return usuarioRepository.findByEmail(userDetails.getUsername())
                .map(u -> {
                    usuarioRepository.delete(u);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
