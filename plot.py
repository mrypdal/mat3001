import matplotlib.pyplot as plt
import numpy as np
from mpl_toolkits.mplot3d import Axes3D

# --- Plot 1: Shortest curve in a plane ---
fig, ax = plt.subplots(figsize=(6, 4))
ax.set_aspect('equal')
ax.axis('off')

p = np.array([1, 1])
q = np.array([5, 3])

# The straight line
ax.plot([p[0], q[0]], [p[1], q[1]], 'b-', linewidth=2, label='Shortest path (Straight line)')

# A perturbed curve
t = np.linspace(0, 1, 100)
x_line = p[0] + t * (q[0] - p[0])
y_line = p[1] + t * (q[1] - p[1])
# Add a bump (perturbation)
perturbation = np.sin(t * np.pi)
x_curve = x_line - 0.5 * perturbation
y_curve = y_line + 0.8 * perturbation

ax.plot(x_curve, y_curve, 'r--', linewidth=2, label='Perturbed path $\\gamma(t) + \\epsilon \\eta(t)$')

ax.plot(*p, 'ko', markersize=8)
ax.plot(*q, 'ko', markersize=8)
ax.text(p[0]-0.2, p[1]-0.3, '$p$', fontsize=14)
ax.text(q[0]+0.1, q[1]+0.2, '$q$', fontsize=14)

plt.legend(loc='lower right')
plt.title('Shortest curve in a plane')
plt.tight_layout()
plt.savefig('public/plane_shortest.svg', format='svg', transparent=True)
plt.close()

# --- Plot 2: Shortest curve on a cylinder ---
fig = plt.figure(figsize=(6, 6))
ax = fig.add_subplot(111, projection='3d')
ax.set_axis_off()

# Cylinder parameters
R = 2
z_min, z_max = 0, 8

# Cylinder surface
theta = np.linspace(0, 2*np.pi, 50)
z = np.linspace(z_min, z_max, 50)
Theta, Z = np.meshgrid(theta, z)
X = R * np.cos(Theta)
Y = R * np.sin(Theta)

# Plot cylinder surface (light blue, semi-transparent)
ax.plot_surface(X, Y, Z, alpha=0.3, color='lightblue', edgecolor='none')

# Plot the helix
t = np.linspace(0, 1, 100)
theta_start = 0
theta_end = 2 * np.pi + np.pi/2 # wraps around more than once
z_start = 1
z_end = 7

# Helix equation: z is linear in theta
theta_curve = theta_start + t * (theta_end - theta_start)
z_curve = z_start + t * (z_end - z_start)
x_curve = R * np.cos(theta_curve)
y_curve = R * np.sin(theta_curve)

ax.plot(x_curve, y_curve, z_curve, 'b-', linewidth=3, label='Geodesic (Helix)')

# Add start and end points
p_x, p_y, p_z = x_curve[0], y_curve[0], z_curve[0]
q_x, q_y, q_z = x_curve[-1], y_curve[-1], z_curve[-1]

ax.scatter([p_x], [p_y], [p_z], color='k', s=50)
ax.scatter([q_x], [q_y], [q_z], color='k', s=50)

ax.text(p_x*1.2, p_y*1.2, p_z, '$p$', fontsize=14)
ax.text(q_x*1.2, q_y*1.2, q_z, '$q$', fontsize=14)

# Try to set limits to make it look nice
ax.set_xlim([-R*1.5, R*1.5])
ax.set_ylim([-R*1.5, R*1.5])
ax.set_zlim([z_min, z_max])

plt.title('Shortest curve on a cylinder')
plt.tight_layout()
plt.savefig('public/cylinder_shortest.svg', format='svg', transparent=True)
plt.close()

print("Plots generated in public/ directory.")
